---
layout: post
title: socket.io简易实践
category: Tool
keywords: websocket, socket.io, chat
description: 使用socket.io实践实现群聊和私聊功能
---

上一篇介绍的是`websocket`，同时也提到了`socket.io`，当时学起它时，突然想起可以尝试做个聊天IM的网页，于是上周末捣鼓了两天，瞎设计+逻辑思考+调试修改，总算实现了。


实现之后我将代码托管到了[coding>>](https://coding.net/u/dont/p/socket.io-chat-demo/git).

其实周一一大早，我改完一些已知的问题之后，就在[segmentfault技术圈](https://segmentfault.com/g/1570000010765899/d/1560000010853206)发帖了。

现在，我重新捋一捋写代码的思路。

### 简单介绍socket.io

socket.io 可以说是一个websocket库，当然在不支持websocket的浏览器下，似乎它会改为使用其他替代技术方案。不过我这里还是以websocket库来说。

socket.io 主要分两部分内容，一个是服务端，一个是客户端（一般指浏览器）。服务端处，主要是启动服务，用于监听来自客户端发起的请求连接，服务端建立了与众多客户端的连接之后，充当一个交流平台，既可以接收客户发来的信息，也可以广播信息给所有连接的客户，还能向指定客户发送特定信息， 而客户端部分，主要是封装了客户端的规范编码方式，向服务端发起连接请求，监听服务端消息和发送消息。

基于这些特征，我就可以去实现群聊跟私聊的功能。

### socket.io 编码基本套路

在服务端，socket.io 主要做的是监听各种socket的连接，并监听socket发来的消息以及给socket发送消息。

首先是服务端的对象实例：

{%highlight javascript%}
var app = require('http').createServer(handler),
 io = require('socket.io').listen(app);
{%endhighlight%}

这是一个最简单的对象实例，挂载到http服务上。在这里`io`就代表这服务端的一个对象实例，它有各式各样的api方法，要发送消息，监听连接都要靠它。

而服务端与客户端的交流逻辑主要都在一个`io.sockets.on('connection', function(socket){})`的回调里进行。

{%highlight javascript%}
io.sockets.on('connection', function (socket) {
  //向所有连接的socket发送消息
  socket.emit('list', { users: sockets });
  //登录消息记录
  socket.on('login', function (data,fn) {
    
    fn({});
    
    io.emit('list', { users: [1,2] });
  });
});
{%endhighlight%}

从上述代码中，可以从名字含义入手理解，所有逻辑操作，都是在`connect`连接事件回调里进行的，回调函数带上的`socket`参数，可以说指代每个和服务端建立连接的客户端对象实例。

此时，我们可以通过`socket.emit('sth',{})` 来让服务端发送给该连接客户端的一个名为sth的消息。

另外可以通过`socket.on('sth',function(data,fn){})`来监听该客户端对服务端发起的sth的消息。这里要注意的是响应回调函数里第二参数，主要代表的是一个客户端的回调，即由客户端发起消息时设定了一个发送时回调函数，此时，在服务端回调中执行`fn()`则可以出发客户端的回调函数调用。（这里fn的函数参数应该不能采用一些特定对象如Date）

如果想广播消息，可以用`io.emit()`.

而客户端方面，首先页面需要引入`socket.io.js`,这个文件服务端脚本已经做了相关文件部署，只需要用绝对路径引用即可：

~~~
<script src="socket.io/socket.io.js"></script>
~~~

{%highlight javascript%}
var socket = io.connect('http://localhost:8787');
 // 收到群聊
socket.on('group', function(data){
    
});
socket.emit('login', {username: user}, function(data){
    //console.log(data);
    currentUser = data;
    alert('登录成功');
    $('.login-wrap').hide();
});
{%endhighlight%}

客户端的代码如下：首先通过`io.connect`方法产出socket对象实例。

通过`socket.on()`的方式来监听服务端发来的消息，这点其实跟服务端的写法几乎一模一样。

`socket.emit`则是发送消息，可以看到第三个可选参数是一个回调函数，也就是前面提到服务端回调执行`fn()`时，就会触发执行这边客户端的回调函数，这种方式，就可以减少一定的编码量，试想，假如客户端发送完消息需要服务端确认收到消息并反馈，如果没有这个回调机制，那么还得考虑新增一条消息类型，并在两端分别做发送和接收处理。

### 开始实践

其实前面说了那么多，主要就是熟悉能用socket.io的方法实现我们想要的功能，接下来就是实现功能的一个逻辑设计。

基于事件消息的实现，业务要分成两种大类：

1. 主体消息：群聊消息（客户端发送给服务端，服务端广播）、私聊消息（客户端发送给服务端，服务端发送给客户端）

2. 辅助消息： 登录消息（告知服务端客户信息以便标识，并广播）、退出消息（告知服务端断连，更新用户信息并广播）

这里先以登录为例，下面是代码：

{%highlight javascript%}
//浏览器部分
$('.login-btn').click(function(){
    var user = $.trim($('.login-user').val());
    if(user){
        //发送登录消息，回调
        socket.emit('login', {username: user}, function(data){
            console.log(data);
            currentUser = data;
            alert('登录成功');
            $('.login-wrap').hide();
        });
    }else{
        alert('请输入昵称');
    }
});


//服务端部分
//登录消息记录
  socket.on('login', function (data,fn) {
    //console.log(data);
    var newUser = {
      username: data['username'],
      id: socket.id,
      portrait: portraits[Math.floor(Math.random()*portraits.length)]
    };
    //fn其实是响应客户端发消息过来后的回调，
    //这里调用fn时，客户端那边会响应地执行其发送消息时定义的回调方法
    fn(newUser);
    userList.push(newUser);
    //登录记录后将全部用户信息发送广播出去
    io.emit('list', { users: userList });
  });
{%endhighlight%}

客户端emit登录的个人信息，服务端接收之后保存信息，并将用户信息再广播出去（广播出去是为了做用户列表显示）。

群聊的功能，也很简单，其实就是客户端发送消息到服务端，服务端接收之后再广播出去，客户端们做好接收和展示即可

{%highlight javascript%}
//客户端发送消息部分
//群聊biu~
$('.group .btn-send').click(function(){
    var text = $.trim($('.group .chat-text').val());
    if(!text){
        alert('内容为空！');
        return;
    }
    //发送群聊消息，回调清空输入框内容
    socket.emit('chat-group', {id: currentUser.id, chat: text}, function(data){
        $('.group .chat-text').val('');
    });
});

//客户端接收群聊消息部分
// 收到群聊
socket.on('group', function(data){
    if(currentUser && data.senderId==currentUser.id){
        data.me = 'me';
    }else{
        data.me = '';
    }
    //省略其他交互逻辑
    var $view = $('.group .chat-view');
    $view.append(tmplChat(data)).scrollTop($view.outerHeight());
});

//服务端部分
//群聊
  socket.on('chat-group', function (data, fn) {
    //console.log(data);
    var senderId = data.id,
        sender = findUserById(senderId),
        chatContent = data.chat;
       //省略一些判断

    fn(data);
    // 广播更新群聊信息
    io.emit('group', {senderId:senderId, senderName: sender.username, senderPortrait: sender.portrait, chat:chatContent});
  });
{%endhighlight%}

到了这里，基本上两大类信息的实现方式，也就基本齐全了，但这里不得不提一下，私聊的一个主要知识点：点对点发送，从上面示例代码可以看出，发送消息都是客户端发送到服务端的，那么如果客户A想给B发送私人信息呢，那么服务端接收到信息之后肯定不能广播出去的了，所以在发送消息时需要带上指定人比如B的`socketId`或者其他能间接获取到`socketId`的信息，`socketId`是连接产生的`socket`对象自带的一个唯一标识，而在服务端处，socket对象有这么一个方法。

{%highlight javascript%}
socket.to(targetId).emit('pm', {senderId:senderId});
{%endhighlight%}

此处，`socket` 为发送方，`targetId`则是消息最终的接收方socket的socketId,因此，只要发送消息时提供socketId，就能利用此方法做到点对点传消息。

另外一个知识点是，`socket`对象有一个`disconnect`方法，用于主动断开连接，其调用时，会触发交互方的`disconnect`事件，因此要注意到，如果你再写一个其他主动的断开连接事件时，记得消息名要避开直接取名`disconnect`。

对于实现功能的总结，这小东西花了我两个周末的时间，其实应用`socket.io`倒是花费很少，最麻烦的，反而在于界面上交互的设计（没美工天赋）和实现。