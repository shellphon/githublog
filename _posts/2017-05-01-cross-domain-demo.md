---
layout: post
title: 最近做了个简单跨域demo
category: Tool
keywords: crossDomain
description: 利用koa做了个跨域demo服务，方便实践一些跨域解决方案。
---

虽说工作上遇到的跨域解决方案，基本就用着两款，jsonp 或者 工作封装的`proxy`(实际就是iframe+document.domain)，但免不了经常来了个嵌入页面的需求（跨子域），为了更加快捷的验证一下嵌入页和跨域方案，于是在coding做了个[repo](https://coding.net/u/dont/p/cross-domain-demo/git)。

项目做得其实很简单，怎么操作，直接看readme.md 就可以。

### 原理

对于跨域来说，那当然是少不了一个条件：多个域名（端口不同也算跨域）。

所以基于koa，就可以建立起web服务来了。

对于静态文件可以直接用`koa-static`;

对于接口，可以用`koa-router`方便写路由;

一般来说，结合nginx+hosts可以做到本地启动多个不同端口的web服务，然后hosts域名，来实现访问80端口的域名直接访问到本地对应的服务。

但如果这样的话，几个域名就要配置几个nginx的配置内容，以及开启多个端口的koa服务。

后来发现`koa-vhost`可以虚拟host多个服务，也就是替代了nginx的配置功能。

如下官方实例代码：

{%highlight javascript%}
var koa = require('koa');
var vhost = require('koa-vhost');
 
var server = koa();
var server1 = koa();
var server2 = koa();
var server3 = koa();
var server4 = koa();
var server5 = koa();
 
server1.use(function *(next) {
    this.body = 'server1';
});
 
server2.use(function *(next) {
    this.body = 'server2';
});
 
server3.use(function *(next) {
    this.body = 'server3';
});
 
server4.use(function *(next) {
    this.body = 'server4';
});
 
server5.use(function *(next) {
    this.body = 'server5';
});
 
server.use(vhost('s1.example.com', server1));
 
server.use(vhost(/s2\.example\.com/, server2));
 
server.use(vhost({
    host: 's3.example.com',
    app: server3
}));
 
server.use(vhost([{
    host: 's4.example.com',
    app: server4
}, {
    host: /s5\.example\.com/,
    app: server5
}]));
 
server.use(function * (next) {
    this.body = 'default server';
});
 
server.listen(3000, function() {
    console.log('server listening port 3000');
});
{%endhighlight%}

看似只用了一个总端口来承载，对应不同域名访问到不同的实际服务去了。（源码看了一点点，没理解透。）

也想过，既然能替代nginx的相关功能，是否能把hosts也给处理了，但发现hosts配置并不需要太多操作，似乎也有对应的npm包，但可能涉及到文件修改权限的问题。还是搁置不处理先。

#### 最后的碎碎念

最近其实也看了不少内容，但细想一下，都是一些轮子源码，有些没理解透，只整理出部分笔记，没法产出个满意的文章，于是就列了这篇充数。另外，fork 阮一峰老师的webpack-demos 加以整理成`npm scripts`的运行命令模式来规避全局安装npm包的麻烦。https://github.com/shellphon/webpack-demos

才感觉慢慢有一种github参与感。