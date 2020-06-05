#!/usr/bin/env node
var optimist = require('optimist');
var WebSocketClient = require('websocket').client;
var log4js = require('log4js');

// websocker 地址
optimist.describe('h', 'Host to connect to (e.g. "ws://124.71.104.137:8080/ws_robot")');
// 创建客户端数量
optimist.describe('c', 'Number of clients to create');
// 单个客户端发送消息次数
optimist.describe('r', 'Number of roundtrips to the server each client should do');
// 消息大小
optimist.describe('s', 'Size of the message to send');
// 消息发送间
optimist.describe('i', 'Interval send message');

optimist.usage('Usage: $0 -h [host] -c [clients] -r [roundtrips] -s [size] -i [interval]').demand(['h']);

var argv = optimist.default('h', 'ws://172.16.0.56:8080/ws_robot')
    .default('c', 1)
    .default('s', 128)
    .default('r', 5)
    .default('i', 1000).argv;

var host = argv.h;
var clients = argv.c;
var size = argv.s;
var roundtrips = argv.r;
var msgInterval = argv.i;

var authInterval = 5;
var index = 0;

// 发送的消息
var message = new Array(size + 1).join('a');

let programName = "log4jstest";
// 自定义日志类别
log4js.configure({
    appenders: {
        console: {//记录器1:输出到控制台
            type: 'console',
        },
        log_file: {//记录器2：输出到文件
            type: 'file',
            filename: __dirname + `/logs/${programName}.log`,//文件目录，当目录文件或文件夹不存在时，会自动创建
            maxLogSize: 20971520,//文件最大存储空间（byte），当文件内容超过文件存储空间会自动生成一个文件test.log.1的序列自增长的文件
            backups: 3,//default value = 5.当文件内容超过文件存储空间时，备份文件的数量
            //compress : true,//default false.是否以压缩的形式保存新文件,默认false。如果true，则新增的日志文件会保存在gz的压缩文件内，并且生成后将不被替换，false会被替换掉
            encoding: 'utf-8',//default "utf-8"，文件的编码
        },
        data_file: {//：记录器3：输出到日期文件
            type: "dateFile",
            filename: __dirname + `/logs/${programName}`,//您要写入日志文件的路径
            alwaysIncludePattern: true,//（默认为false） - 将模式包含在当前日志文件的名称以及备份中
            daysToKeep: 10,//时间文件 保存多少天，距离当前天daysToKeep以前的log将被删除
            //compress : true,//（默认为false） - 在滚动期间压缩备份文件（备份文件将具有.gz扩展名）
            pattern: "-yyyy-MM-dd-hh.log",//（可选，默认为.yyyy-MM-dd） - 用于确定何时滚动日志的模式。格式:.yyyy-MM-dd-hh:mm:ss.log
            encoding: 'utf-8',//default "utf-8"，文件的编码
        },
        error_file: {//：记录器4：输出到error log
            type: "dateFile",
            filename: __dirname + `/../logs/${programName}_error`,//您要写入日志文件的路径
            alwaysIncludePattern: true,//（默认为false） - 将模式包含在当前日志文件的名称以及备份中
            daysToKeep: 10,//时间文件 保存多少天，距离当前天daysToKeep以前的log将被删除
            //compress : true,//（默认为false） - 在滚动期间压缩备份文件（备份文件将具有.gz扩展名）
            pattern: "_yyyy-MM-dd.log",//（可选，默认为.yyyy-MM-dd） - 用于确定何时滚动日志的模式。格式:.yyyy-MM-dd-hh:mm:ss.log
            encoding: 'utf-8',//default "utf-8"，文件的编码
            // compress: true, //是否压缩
        }
    },
    categories: {
        default: { appenders: ['data_file', 'console', 'log_file'], level: 'info' },//默认log类型，输出到控制台 log文件 log日期文件 且登记大于info即可
        production: { appenders: ['data_file'], level: 'warn' },  //生产环境 log类型 只输出到按日期命名的文件，且只输出警告以上的log
        console: { appenders: ['console'], level: 'debug' }, //开发环境  输出到控制台
        debug: { appenders: ['console', 'log_file'], level: 'debug' }, //调试环境 输出到log文件和控制台    
        error_log: { appenders: ['error_file'], level: 'error' }//error 等级log 单独输出到error文件中 任何环境的errorlog 将都以日期文件单独记录
    },
});

var logger = log4js.getLogger();
logger.level = 'debug';


var conn_list = [];

var interval = setInterval(function () {
    if (index < clients) {
        uid = clients;
        cid = clients;
        init(uid, cid);
        index++;
    } else {
        clearInterval(interval);
        send_msg();
    }
}, authInterval);

var send_msg = function () {
    var msg = setInterval(function () {
        logger.info('begin send msg');
        if (roundtrips > 0 && conn_list[0] != undefined) {
            for (var i = 0; i < conn_list.length; i++) {
                const connection = conn_list[i];
                if (connection.connected) {
                    var msg_index = 0;
                    var msg_interval = setInterval(function () {
                        if (msg_index < roundtrips) {
                            logger.info("client id " + connection.id + ',    send:' + message);
                            connection.sendUTF(message.toString());
                            msg_index++;
                        } else {
                            clearInterval(msg_interval);
                            connection.close();
                        }
                    }, msgInterval);
                }
            }
            clearInterval(msg);
        }
    }, 1000);
}


init = function (uid, cid) {
    var client = new WebSocketClient();
    client.connect(host);

    client.on('connectFailed', function (error) {
        logger.error('Connect Error: ' + error.toString());
        init(uid, cid);
    });

    client.on('connect', function (connection) {
        logger.info(index + ' Connected');
        connection['id'] = index;
        conn_list.push(connection);

        connection.on('error', function (error) {
            logger.info("Connection Error: " + error.toString());
        });
        connection.ping(1);
        connection.on('ping', () => {
            connection.pong();
        });

        connection.on('close', function (error) {
            logger.info(error + ';  Connection Closed');
        });

        connection.on('message', function (message) {
            logger.info("client id " + connection.id + ",  Received:" + message.utf8Data);
        });
    });
};

