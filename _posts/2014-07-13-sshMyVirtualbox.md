---
layout: post
title: ssh访问虚拟机linux

---
终于开始折腾怎么`ssh`连接虚拟机了。

* 宿主机：win7  
* 虚拟机：virtual box （系统：elementary os luna）  
* 网络：桥接模式（让虚拟机与宿主机处于同一网段，不同ip，能互相ping通）  
* ssh客户端：x-shell  

***
步骤
***

##### 一、环境设置完之后，我们要获悉到linux里被分配的ip，假设是 192.168.1.108 

1. 为了保持持久的ssh访问，以往ip都是动态分配，我们可以设置成静态ip，这样就不用每次都找ip了。   
2. 编辑interfaces:`sudo vim /etc/network/interfaces`  
> ```
 auto eth0
 iface eth0 inet static
 address 192.168.1.108
 netmask 255.255.255.0
 gateway 192.168.1.1
```

3. 编辑/etc/resolv.conf:`sudo vim /etc/resolv.conf`  

> ```
 nameserver 8.8.8.8
```  

##### 二、重启eth0:  
	建议在linux shell里做，或者重启系统`sudo ifdown eth0`和`sudo ifup eth0`

##### 三、linux要开启ssh服务，才能被其他机子ssh到，这里我装了 `openssh-server`  
> ```
 sudo apt-get install openssh-server  
```

1. 然后键入 `netstat -tlp`查看ssh服务是否已经开启  

##### 四、接下来就是ssh客户端访问linux了，很简单。  
