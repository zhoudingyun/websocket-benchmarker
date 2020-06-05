# websocket-benchmarker
websocket-benchmarker压力测试工具

一、说明
    在centos7单核双线程 4G内存华为云主机，共16台完成百万长连接且（消息发送频率为：1s）

二、优化
   1, 服务端优化
   1.1 修改/etc/security/limits.conf

	    命令：vi /etc/security/limits.conf

		   把65535                                                            修改为1000000

		   root soft nofile 65535                                         root soft nofile 65535       

		   root hard nofile 65535                                       root hard nofile 65535

		   * soft nofile 65535                                             * soft nofile   1000000

		   * hard nofile 65535                                            * hard nofile 1000000

   1.2 修改/etc/sysctl.conf

		命令：vi /etc/sysctl.conf  内容如下

		# 获取端口范围

		net.ipv4.ip_local_port_range = 500 65000

		# 系统最大文件打开数

		fs.file-max = 20000000

		# 单个用户进程最大文件打开数

		fs.nr_open = 20000000

		# 全连接队列长度,默认128

		net.core.somaxconn = 10240

		# 半连接队列长度，当使用sysncookies无效，默认128

		net.ipv4.tcp_max_syn_backlog = 16384

		net.ipv4.tcp_syncookies = 0

		# 网卡数据包队列长度

		net.core.netdev_max_backlog = 41960

		# time-wait 最大队列长度

		net.ipv4.tcp_max_tw_buckets = 300000

		# time-wait 是否重新用于新链接以及快速回收

		net.ipv4.tcp_tw_reuse = 1

		net.ipv4.tcp_tw_recycle = 1

		# tcp报文探测时间间隔, 单位s

		net.ipv4.tcp_keepalive_intvl = 30

		# tcp连接多少秒后没有数据报文时启动探测报文

		net.ipv4.tcp_keepalive_time = 900

		# 探测次数

		net.ipv4.tcp_keepalive_probes = 3

		# 保持fin-wait-2 状态多少秒

		net.ipv4.tcp_fin_timeout = 15

		# 最大孤儿socket数量,一个孤儿socket占用64KB,当socket主动close掉,处于fin-wait1, last-ack

		net.ipv4.tcp_max_orphans = 131072

		# 每个套接字所允许得最大缓存区大小

		net.core.optmem_max = 819200

		# 默认tcp数据接受窗口大小

		net.core.rmem_default = 262144

		net.core.wmem_default = 262144

		net.core.rmem_max = 16777216

		net.core.wmem_max = 16777216

		# tcp栈内存使用第一个值内存下限, 第二个值缓存区应用压力上限, 第三个值内存上限, 单位为page,通常为4kb

		net.ipv4.tcp_mem = 786432 4194304 8388608

		# 读, 第一个值为socket缓存区分配最小字节, 第二个，第三个分别被rmem_default, rmem_max覆盖

		net.ipv4.tcp_rmem = 4096 4096 4206592

		# 写, 第一个值为socket缓存区分配最小字节, 第二个，第三个分别被wmem_default, wmem_max覆盖

		net.ipv4.tcp_wmem = 4096 4096 4206592

		# 将连接改为200w+以满足单机100w长连接.

		net.nf_conntrack_max=2048576

      保存之后执行命令：sysctl -p /etc/sysctl.conf

    2 ，客户端（16台都要执行）

        命令：echo ‘net.ipv4.ip_local_port_range = 500 65000’  >>  /etc/sysctl.conf

        命令：sysctl -p /etc/sysctl.conf
   
三、安装node环境
     命令：wget https://nodejs.org/dist/v12.18.0/node-v12.18.0-linux-x64.tar.xz

     命令：xz -d node-v12.18.0-linux-x64.tar.xz

     命令： tar -xf node-v12.18.0-linux-x64.tar

     命令：ln -snf /home/workspace/node-v12.18.0-linux-x64/bin/node /usr/bin/node

     命令：ln -snf /home/workspace/node-v12.18.0-linux-x64/bin/npm /usr/bin/npm

     命令：ln -snf /home/workspace/node-v12.18.0-linux-x64/bin/npx /usr/bin/npx

     命令：cd /home/test/workspace/websocket-benchmarker

     命令：npm install --save

     命令：node ./bin/websocket-benchmarker.js  -c 62500 -r 1000000 -h ws://172.16.0.184:8080/ws_robot     #启动客户端


四、websocket-benchmarker启动说明
|-h|websocker服务端路径|ws://172.16.0.184:8080/ws_robot|
|:---|:---:|---:|
|-c|启动客户端数量|60000，启动6万个客户端，默认：1|
|-r|发送消息次数|100，默认：5次|
|-s|消息大小|	10，默认：128字节|
|-i|消息间隔多久发送|	1000，默认：1s|
