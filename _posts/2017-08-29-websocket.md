---
layout: post
title: websocket初学总结
category: Hellocode
keywords: websocket
description: 关于websocket简单介绍以及websocket实践
---

上一周有空就研究了一下`websocket`，我记得很久之前有一次面试被问到`websocket`，不过当时我并不会，只是听说过有这么个东西，知识点太多了，如果说工作上不会用到的话，我并不着急着去学，更何况是比较新的，浏览器支持不是很全面的知识点呢，但是既然最近有空，于是就看了一下。

### 1.什么是websocket

websocket是一个网络协议，其最大的特点就是可以由服务端主动向客户端通信，客户端也可以向服务端发送消息，一种双向通信的解决方案。注意重点：`双向`

### 2.在websocket之前

聊`websocket`之前，我们先来了解`websocket`之前的相关技术。`http`其中一个特点，就是通信只能由客户端主动向服务端发起请求（单向），如果要做一些实时类的，比如IM、聊天室，在没有`websocket`之前，我们需要用其他的解决方案来处理。

1.短轮询（又叫轮询）：通过定时器不断使用ajax向服务端请求数据;

像这样的对话：

~~~
(0:00) 
客户端：喂，服务端，我有信息吗？
服务端：没有哦
(1:00)
客户端：喂，我有新的消息么？
服务端：没有哦
(2:00)
客户端：喂，我有新的消息么？
服务端：有啦，拿着
(3:00)
客户端：喂，我有新的消息么？
服务端：没有哦
……
~~~

缺点可想而知，轮询频率和更新时机都是一个影响连接效率和性能的问题，浪费带宽；

2.长轮询：其实跟短轮询有点像，都是ajax实现，只是这次是先ajax设置超时时间，后端挂起请求，当响应时，处理好响应后递归调用ajax，或当ajax请求达到超时时间时，重新递归ajax请求。

~~~
(0:00) 
客户端：喂，服务端，我有信息吗？没有的话我就等着，有消息就告诉我
服务端静静的默不作声，因为没有消息，所以hold着连接
(1:00)
服务端：有消息来了，拿着。(ajax完毕)
客户端接到回答后，紧接着又：喂，服务端，我有信息吗？没有的话我就等着，有消息就告诉我
服务端静静的默不作声，因为没有消息，所以hold着连接
(2:00)
服务端：有消息来了，拿着。(ajax完毕)
客户端接到回答后，紧接着又：喂，服务端，我有信息吗？没有的话我就等着，有消息就告诉我
服务端静静的默不作声，因为没有消息，所以hold着连接
(3:00)
上一个连接超时了关闭了连接，于是
客户端接到回答后，紧接着又：喂，服务端，我有信息吗？没有的话我就等着，有消息就告诉我
……
~~~

缺点：一直占着服务器资源连接。

3.流：从[关于轮询实现参考资料](http://www.cnblogs.com/hoojo/p/longPolling_comet_jquery_iframe_ajax.html)来看，指的是长轮询的另一种基于iframe 或者htmlfile的流。具体可以到链接原文查看，这里不做讲述。

4.SSE  Server-SentEvents（貌似只是接受服务端信息），这块我没深入研究

5.Flash 依赖flash，移动端支持不好，于是慢慢淡出

综上，各种方案都有着一定的缺点，尽管flash方案似乎挺好的，但奈何移动端支持不好，随着技术不断发展，便有了更好的websocket解决方案，简单来说websocket就是基于TCP的双向通信实时传输协议，它是基于事件的方式来做数据处理响应的，并且允许跨域。

### 3.websocket怎么用

#### websocket的简单原生使用：包括客户端和服务端

在浏览器端，会有一个`WebSocket`的对象，通过new构造的方式来建立websocket连接，通过实例ws调用`onopen`方法来监听连接建立事件，通过`onmessage`来监听服务端分发消息事件，通过`onclose`来监听关闭连接事件，通过`send`方法来向服务端推送消息。示例如下：

客户端：（浏览器） 需要另外启动服务来承载这个页面

{%highlight html%}
  <div id="app">
    <input type="text" id="word"> <button id="btn">biu~</button>
    <p class="result">
    </p>
  </div>
  <script>
  // 初始化，建立连接
    var ws = new WebSocket("ws://127.0.0.1:10087");
    // 监听连接建立事件
  ws.onopen = function(evt) { 
    console.log("Connection open ..."); 
    //向服务端发送信息
    ws.send("Hello WebSockets!");

  };
    //监听服务端分发信息事件
  ws.onmessage = function(evt) {
    console.log( "Received Message: " + evt.data);
    //ws.close();
    // evt.data 为服务端发回的信息
    var res = document.querySelector('.result');
      res.innerHTML += JSON.stringify(evt.data);
  };
    //监听服务关闭事件，可通过 ws.close() 发送关闭
  ws.onclose = function(evt) {
    console.log("Connection closed.");
  };      
    
   document.getElementById("btn").onclick = function(){
    var input = document.getElementById('word').value;
    ws.send(input);
   };
   
  </script>
{%endhighlight%}


服务端：`node`实现，可选用[ws](https://github.com/websockets/ws)

先安装`ws`

~~~
npm install ws
~~~

然后写脚本

{%highlight javascript%}
var WebSocket = require('ws');
//启动ws的服务，监听端口号
var wss = new WebSocket.Server({ port: 10087 });

// 连接连通事件
wss.on('connection', function connection(ws) {
  //监听消息
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });
  // 向客户端发送消息
  ws.send('something server');
});
{%endhighlight%}

前面提到`index.html`要启动一个服务来承载，当然也可以直接服务端脚本一同承载之

{%highlight javascript%}
var http = require('http');
var WebSocket = require('ws');
//创建一个web服务
var app = http.createServer(onRequest).listen( 10087 );
var fs = require('fs');

//在这个服务下建立ws
var wss = new WebSocket.Server({server:app});

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  ws.send('something server');
});
// 输出index.html
function onRequest(req, res){
 fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}
{%endhighlight%}

这样就能直接打开 `http://127.0.0.1:10087` 访问到`index.html`了，并且页面能和服务端直接通信。不过对比前面`index.html`独立承载的话，还能突出一个`ws`可跨域的特点。

再细化的ws操作，可参考ws的[github](https://github.com/websockets/ws)。

### 4.补充：socket.io 简易实践

接下来，说一说一套全面的ws封装：[socket.io](https://github.com/socketio/socket.io)（在不支持ws的浏览器时，它还有其他方案的实现模拟）

它封装了服务端和客户端一套实现，简化客户端和服务端的编码操作。

首先我们来做一个简易的多客户端向服务端消息交互的demo，从而认识socket.io的用法。

客户端：首先客户端需要引入`socket.io`的客户端封装js，从而能够使用到io的api。

所以页面如要引入：

~~~
<script src="/socket.io/socket.io.js"></script>
~~~

为什么是这样的一个地址呢？这个先带着疑问，看下去。

客户端的socket跟原生ws一样，都是要先建立连接，然后监听消息事件。

通过`socket = io.connect('http://localhost:8787');`的方式得到socket对象实例，剩下的操作基本都在socket上调用方法，比如监听消息`socket.on('message',function(){})` 和发送消息`socket.emit('message',{})`

详情见如下代码：

{%highlight html%}
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>websocket test</title>
</head>
<body>
  <div id="app">
    <input type="text" id="word"> <button id="btn">biu~</button>
    <input type="text" id="other"> <button id="btn1">biu biu~</button>
    <p class="result">
    </p>
  </div>
  <script src="/socket.io/socket.io.js"></script>
  <script>
   //建立ws连接
   var socket = io.connect('http://localhost:8787');
   //监听名为server的消息
   socket.on('server', function (data) {
     console.log(data);
     var res = document.querySelector('.result');
      res.innerHTML += JSON.stringify(data);
     //socket.emit('my other event', { my: 'data' });
   });  
   document.getElementById("btn").onclick = function(){
      var input = document.getElementById('word').value;
      //向服务端发送名为client的消息
      socket.emit('client', { my: input });
   };
   document.getElementById("btn1").onclick = function(){
      var input = document.getElementById('other').value;
      socket.emit('client other', { my: input });
   };
  </script>
</body>
</html>
{%endhighlight%}

到此，客户端部分完成

再来就是服务端：我们需要http模块建立web服务并承载客户端页面，其次则是将socket.io服务绑定到这个web服务

{%highlight javascript%}
var app = require('http').createServer(handler),
 io = require('socket.io').listen(app),
 fs = require('fs')

app.listen(8787);

//访问首页时输出首页内容响应
function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

//用以记录建立连接的socket id数据
var sockets = [];

// socket建立连接事件监听
io.sockets.on('connection', function (socket) {
  //保存 socket的id
  sockets.push(socket.id);
  //向所有连接的socket发送server消息
  socket.emit('server', { hello: 'world' });
  //监听client消息
  socket.on('client', function (data) {
    console.log(data);
    // 发送server消息
    socket.emit('server', { recieve: data });
    // 广播消息
    // io.emit('server', { recieve: data });
  });
  //监听client other的消息，这里用来做简单的点对点发送
  socket.on('client other', function (data) {
    console.log(data);
    //这里粗略的使用前两个建立的socket来进行点对点发送
    var target = socket.id==sockets[0]?sockets[1]:sockets[0];
    data.src="pm";
    // socket的点对点发送，向另一个socket发送消息
    socket.to(target).emit('server', { recieve: data });
  });
});
{%endhighlight%}

`socket.io`源码中有这么一个[方法>>](https://github.com/socketio/socket.io/blob/master/lib/index.js#L286~L311) 在启动`socket.io`时，增加了客户端`socket.io.js`的一个路由映射，因为前面客户端页面可以通过那样的路径来引入客户端js

这样，一旦启动了服务端的脚本，就架起了web服务和socket.io的服务，就可以在页面上实现向服务端发送消息和向其他客户端发送消息了，就可验证socket.io的使用了，很方便。

最后提一下，websocket支持跨域，那么势必也会有一定的安全方面的考虑，有兴趣可以翻看这篇[文章](https://www.ibm.com/developerworks/cn/java/j-lo-websocket-cross-site/index.html)

### 参考资料：

[WebSocket 教程](http://www.ruanyifeng.com/blog/2017/05/websocket.html)

[websocket实战](http://ued.sina.com.cn/?p=900)

[web 实时通信的方法总结](http://www.jianshu.com/p/01e409ecdb6b)

[Web 消息推送及 WebSocket 简介](https://zqianduan.com/2016/03/17/websocket-introduction/)

[Web 通信 之 长连接、长轮询（long polling）](http://www.cnblogs.com/hoojo/p/longPolling_comet_jquery_iframe_ajax.html)