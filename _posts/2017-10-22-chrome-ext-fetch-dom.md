---
layout: post
title: chrome扩展抓取页面的解决方案
category: Hellocode
keywords: chrome,extension
description: 扩展程序利用iframe来抓取页面
---

这次记录的是，关于扩展程序跨域抓取页面的一个解决方案描述。

国庆刚过完，换了工作了。这个月眼看就到底了，时间过得好快，最近也没啥主题好写的样子，每天下班回家玩一会游戏然后玩keep或者跑步，洗完澡就到点睡觉了。昨晚刚整理了一下事件循环知识点，放在[sf的技术圈帖子](https://segmentfault.com/g/1570000010765899/d/1560000011585660)里，这次就把最近学到的扩展程序新处理方式记录一下。

### 问题

先抛出个问题，扩展程序抓取页面，怎么做？

抓取页面势必会涉及到跨域，比如说在扩展程序的页面里，用ajax的方式去请求某个url，从而得到该页面的html，很明显，这个url一般跟扩展程序是不在同一个域的，那就跨域了，但是，如我之前做过的一个小扩展，检测收藏夹链接是否有效的解决方案一个道理（[见链接]({{site.baseurl}}/2017/07/chrome-ext-bookmarkd.html)）,只要在`manifest.json`配置文件中配置好允许访问的地址，就能毫无顾忌的跨域ajax了。

的确，这是一个办法，当如果说我要具体到页面的某个dom，而这个dom是页面加载完之后需要经过一定时间，或者需要js动态生成，那么请求页面得到的html就不能得到这个dom了，总不能扩展本地再搞个html解析之类的来运行这个html吧？……

### 方案

既然想到需要html解析和js运行，再结合跨域的概念，此时我们可以在扩展程序的页面，放一个iframe，让iframe打开这个页面url，自然iframe就会运行这个页面的html和js等等了。然后再通过父页面访问子页面，不就能得到子页面的dom了么？

慢着，既然是iframe，那就涉及到跨域的另一个层面，frame之间的访问权限也是有跨域安全策略限制的。也就是说父页面访问子页面受限于跨域问题，大部分情况下，父页面都访问不到子页面的dom内容。

扩展程序里脚本有一种叫内容脚本，是浏览器在打开符合条件的网页时，向页面注入的特定脚本，该脚本能自由访问页面的内容，还能调用浏览器提供给扩展用的api。那么如果我们能够让iframe打开的页面，也注入内容脚本，我们就可以在iframe上用脚本做任何事，比如收集dom信息，然后与父页面做通信交流。父子页面跨域通信交流可以考虑`postMessage`这个方法，此时父页面只需要做的是监听message事件，静待子页面发送消息即可。

### 分解知识点

前面提到的方案里，主要需要弄懂两个知识点：`内容脚本与配置`、`postMessage`.

#### 内容脚本

关于内容脚本，我们可以参考chrome给的介绍，不过考虑到需要翻墙，在网上找到了一个[免翻墙且汉化版介绍](http://chrome.w3cboy.com/extensions/content_scripts.html).

我们先假设一个场景，那就是我们要抓取百度页面的搜索记录，一般链接是：

```
https://www.baidu.com/s?q1=关键词
```

那么就可以在百度的页面注入内容脚本，相关配置如下：

~~~
"content_scripts": [
    {
      "matches": ["https://www.baidu.com/s?*"],
      "js": ["collect.js"],
      "all_frames":true,
      "run_at":"document_end"
    }
  ],
~~~

这个配置的意思是，当打开的页面是matches配置的链接时，自动注入collect.js

`all_frames:true`表示iframe打开的页面也要注入内容，默认iframe是不会注入内容脚本的。

`run_at`则是决定脚本在什么时候注入（相对于页面加载时间线）。

这个时候我们就可以在collect.js里写出收集dom的逻辑代码以及页面之间通信的代码了。

注： 由于我们主要是想在iframe嵌入内容脚本，那么这个内容脚本可以考虑运行实际逻辑之前，先判断当前页面是否iframe形式被打开。

判断方法很简单：

~~~
if(window.top!==window){
  //非被嵌入页面，window.top还是为window
}
~~~

#### postMessage

前面提到内容脚本收集完数据，接下来应该是向父页面发送数据，`postMessage`为页面间通信带来了方便。

关于`postMessage`可以看[MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/postMessage)

一般来说，使用方式分为发送方和接收方：

发送方，拿这里用iframe的为例。

向父页面发送消息：

~~~
window.top.postMessage({desc:"我是数据"},'*');
~~~

接收方，监听信息：

~~~
window.addEventListener("message", function(event){}, false);
~~~

监听回调函数内参数event表示发送信息的相关细节。

其中event.data为发送方发送的消息正文，如上例中的`{desc:"我是数据"}`，
event.origin则是指代发送方的origin，是一个字符串，由协议+'://'+域名+端口组成（省略的端口除外），接收方可以通过origin来筛选出想要的信息。


综上，记录了关于扩展如何利用iframe来跨域抓取页面，讲解相关知识点，不过用法没有细化下去，如果再考虑一下，这其实也蛮多限制的，那就是iframe加载页面可能会很久，这样要获取数据的时间就变得很长，有时候就会影响体验。

在这期间，还可能遇到被嵌入的页面对iframe有一定的阻挡措施，比如页面脚本检测当前被iframe嵌入，且父页面和自己不同域的情况下，脚本会强行让父页面直接跳转到子页面的地址去，这个时候就需要设置iframe的一个html5属性`sandbox`来限制子页面脚本修改父页面navigation的行为。

更多iframe介绍可以[看这里](https://segmentfault.com/a/1190000004502619).

### updated:

顺手做了个简单的示例demo：https://coding.net/u/dont/p/my-chrome-ext/git/tree/master/little-search



