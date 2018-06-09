---
layout: post
title: 父子页面传数据的思考
category: Hellocode
keywords: iframe, postMessage, cookies, localStorage
description: 关于子页面获取父页面给的数据的几种方案思考调研
---

最近周会部门老大提出一个前端开发的注意事项，就是父页面弹窗出子页面，而子页面需要用到父页面给的数据时，需要保证获得的数据是一次性的，不能因为父页面的其他操作，导致子页面后来拿到的数据有变化或者被覆盖了，这样就有影响了。那时就在想，现有的项目实践上，应该不至于出现这些问题，随后同事又有一个需求需要这么做，来问我，原本他是用`localStorage`来存储共享的数据，但是父子页面域名不同，导致获取子页面获取不到父页面设置的数据。 于是，我一下子想到好几个办法，不过总得来看，他的需求只是页面子域不同而已，那么公共脚本里已经将domain设置到主域上了，所以其实直接进行frame之间的window是可以互相访问的。 事后，我还是想想有没有其他方法，于是做了一下这次思考的总结。

### 都有哪些方案？

先假设一个实际场景，父页面为项目列表页（`list`）， 子页面为项目详情页（`detail`）， 父页面交互点击某个项目的详情链接时，弹窗打开`detail`页面，并显示对应的项目详情，假设父页面本身就包含详情的具体信息了。

1.最传统做法：详情接口和url传id，在我们做增删改查demo的时候，这是最常见的场景了，通常列表有个项目的id，点击到详情的时候，前端通过id调详情接口获取项目详情的信息，从而渲染detail页。 这种最常见，也直接方便，但正如我一开始说到，父页面可能本身就包含详情具体信息了，如果能直接传数据给页面，实际上，就没必要浪费一个接口请求去获取数据了。【可能这种场景也是怪怪的，既然都有所有数据了怎么还要弹多一个页面呢，这种细节我们不展开了，这里我只是做一个简单设想罢了】

2.既然父页面有数据，那么在方法1里，url可以传id，通过也可以把所有数据传过去。这的确是个办法，但一来url太长，二来url地址传说是有长度限制的，我做的项目基本用过url来传递所有数据。

3.cookie共享，前提，父子页面是同主域的，当然子域也一样更好，不然就得cookie设置domain主域，这样list把数据设置到cookie去，detail通过读取cookie获取即可，但同样的cookie也不是个好办法，因为它主要是给前后端用的，一旦你设置了cookie，在http请求上都会自动带上cookie，那么我们前端在cookie上设置的不是给后端用的东西，每次请求都带上，有点多余，而且也不好管理，再者如果数据很多，cookie变得很大， 那就更不好了。

4.页面的互相访问，前提父子页面必须同主域，然后设置domain=主域，这样父子页面就能互相访问文档了。

4.1假如detail要的数据都在list的dom上，那让detail的逻辑去访问list的dom获取即可，不过写起来估计有点麻烦，还要有针对的写对应的处理逻辑。

4.2list把目标数据存成window的全局属性，detail直接window.parent.xxx就可以得到目标数据，这种方法，我之前经常用。

5.文首提到同事用了localStorage，但是因为页面不同域名，所以获取不到，但如果两个页面都在一个域名下的话，其实用localStorage也是挺直接方便的。

6.要提到我这次总结的重点了：postMessage

postMessage可以说解决了跨主域等问题，前面提到的方案，大多只支持到跨子域，但postMessage是可以跨全域的。[详情见>>](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/postMessage)

主要做法可以是，list在打开detail页面的时候，list将详情数据通过postMessage发送到iframe上，而detail则做message事件监听，获取到数据之后，渲染自己的页面即可。

刚开始想到这个方案的时候，我突然想，list得等detail的监听事件声明执行了才能开始发送吧，不然估计detail打开的慢的时候，消息发出来了，可是detail的监听还没开始呢，那就尴尬了。

这时候有两种方式来处理这个发送时机的问题，一个是detail也做postMessage发送，向父页面发送要索取数据的消息，父页面也要做监听，监听到消息之后开始发送消息给detail；不过这样感觉做起来有点麻烦。所以，第二种更直接一点，那就是，一般来说detail的监听在onload的时候应该是执行完毕的了，那么直接list添加iframe的时候，iframe的onload事件来告知list可以传递数据。

大概代码如下：

{%highlight javascript%}
//父页面的脚本
(function(){
    function popB(message){
        var iframe = document.createElement('iframe'); 
            iframe.src="http://b.domain/pm-time.html";  
            iframe.id = "b";
            iframe.onload = function(){
                document.getElementById('b').contentWindow.postMessage(message, "http://b.domain/");
            };
            document.body.appendChild(iframe);
            
            /*
            setTimeout(function(){
               document.getElementById('b').contentWindow.postMessage(message, "http://b.domain/");
            },80);
            */
    }
    

    var btn = document.getElementById('btn');
    btn.onclick = function(e){
        e.preventDefault();
        popB('I am data of a.domain');
    };
    window.addEventListener("message",function(e){
        result.innerHTML = "来自"+e.origin+":"+e.data;
    },false);
})();
// 子页面的脚本
(function(){
    var result = document.getElementById('result'),
        pWin = window.parent;
    window.addEventListener("message",function(e){
        result.innerHTML = "来自父窗口"+e.origin+":"+e.data;
        pWin.postMessage("你发给我："+e.data,"http://a.domain/");
    },false);
    window.onload = function(){
        pWin.postMessage("我加载完毕了","http://a.domain/");
    }
})();
{%endhighlight%}

就想到了这几种方案，按老大的意思的话，最后一种方案，应该说是比较符合的，满足其组件低耦合的设计规则。

看了下，距离上一篇技术日志已经四个月了快，哈哈哈，最近不是工作就是跑步游泳keep，瘦到120斤了，但感觉体脂率还是没下去，业余时间都没咋好好想技术的东西，刚好这一周都在下雨，刚好又有个小主题可以写，就写一写了。

我觉得做技术，还是得用心去实践，当你想到一个方案，你只有去实践了才知道其是否可行，别被一时的想法牵着走，以为可行或者以为不可行，很多时候，我想到的一个东西，真的去实践的时候发现其实还是遇到不少坑的，遇到了才会去解决，才有所成长。

#### 十年之后，终于才明白 只要全力以赴 就无所谓失败 --- 骄傲的少年