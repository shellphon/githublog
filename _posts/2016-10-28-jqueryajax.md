---
layout: post
title:  浅读jquery源码之ajax
category: Hello Code
keywords: jquery, ajax, jsonp, sourcecode
description: 
---

在一次面试中，对方问了我一个问题，jquery的jsonp，怎么处理异常的？（大致意思吧）


这个答得不大好，主要是用得少没怎么去研究，于是就开始入手jquery源码的学习，只是为了理解jsonp怎么实现。


于是从国庆前就开始在云课堂上看 逐行分析jquery源码 （来自妙味课堂的教程），觉得挺好懂的，国庆后，看完了58个视频，发现后面没有了，sizzle、事件、dom操作、ajax等等，都没有相关视频。


最后还得自己低效率的来看源码，找资料，实在也是找不到58个视频之后的，估计是没有录了吧，尴尬……


最近总算是看完ajax的部分，相比较on事件那块，这一个倒是不难懂，不过还得靠其他大牛博客提醒 比如 http://www.cnblogs.com/aaronjs ，正好其jquery分析版本跟视频的是一致的，2.0.3. 


大致上ajax部分，从api上看，其实其核心逻辑是 `$.ajax`方法，其他相关ajax接口方法最终都是调用此方法；


而`$.ajax`方法其主要可分为四部分内容：  

### 1.整体逻辑 ： 

即从请求开始的处理，请求头处理，定义自定义ajax事件和流程触发等情况，再到调用预置过滤器，获取对应的请求分发器，调用分发器分发请求，闭包回调done函数，借助jQuery.deferred做异步回调等等。


### 2.预置过滤器： 

主要是生成这么一个对象,`{'script':Array[fn],'json':Array[fn],'jsonp':Array[fn]}`针对不同的数据类型做各自的过滤处理，主要是jsonp的处理，关于如何将jsonp得到的js代码转换成真实有效的json结果数据


### 3.请求分发器：

默认的ajax是通过XMLHttpRequest对象进行操作的，但jsonp这种需要通过动态加入script的方式处理，于是产生了请求分发器这个东西，其主要用于生成一个包含send、abort方法的对象，用于统一ajax的发送操作。实际关于jsonp的异常处理，也是在这里有所涉及


### 4.类型转换器：

由于ajax接口返回的类型一般主要是字符串，这里ajax方法规定的几种类型，势必需要有一个统一的结果数据转换工具，于是诞生了类型转换器。


其主要包括这几个类型转换规则：

~~~
// Convert anything to text
"* text": String,
// Text to html (true = no transformation)
"text html": true,
// Evaluate text as a json expression
"text json": jQuery.parseJSON,
// Parse text as xml
"text xml": jQuery.parseXML
// 通过其他方法加入的
"text script": function( text ) {
		jQuery.globalEval( text );
		return text;
	}
~~~

还有jsonp的预置过滤器动态加入了："script json"的处理


那么，关于jsonp的异常处理在哪里呢？

{%highlight javascript%}
// Bind script tag hack transport
jQuery.ajaxTransport( "script", function( s ) {
	// This transport only deals with cross domain requests
	if ( s.crossDomain ) {
		var script, callback;
		return {
			send: function( _, complete ) {
				script = jQuery("<script>").prop({
					async: true,
					charset: s.scriptCharset,
					src: s.url
				}).on(
					"load error",
					callback = function( evt ) {
						script.remove();
						callback = null;
						if ( evt ) {
							complete( evt.type === "error" ? 404 : 200, evt.type );
						}
					}
				);
				document.head.appendChild( script[ 0 ] );
			},
			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
});
{%endhighlight%}

其实，他是通过监听script的load跟error事件来做相应处理的,最终会在后续的回调逻辑里因为失败而调用error回调等等情况，既然如此，在jquery官网文档上还是能看到这么一句话

> Note: This handler is not called for cross-domain script and cross-domain JSONP requests. 

这是描述error参数的时候说的，也就是说它不会被跨域的请求调用到，但是实际上在使用jsonp访问一个404接口时，它还是能调用到error回调，当时就觉得奇怪，现在看回源代码，如果接口404不存在，那script应该会触发error事件，从而也会触发到error回调才对。

后来在不经意搜索中发现了这么一句话：

> jsonp调用时其实是在header中创建一个script的dom节点，然后通过script的资源调用方式去向远程服务器发送请求的，问题的关键就在这个script标签上。如果想知道这个资源地址有没有请求成功，我首先想到的是onload和onerror这两个回调函数，遗憾的是，ie6,7,8都是不支持script的onload和onerror回调！我想，这个应该是jquery无法捕获到这个错误的原因吧。那么有没有其它办法来处理这个错误呢，答案是有的，并且很简单，只要加上timeout参数即可

这才想起来，当时面试最终提示的也是timeout关键字，也就是面试的目的是想知道面试者是否知道这一特点吧。

![image](http://dont27.qiniudn.com/jqueryajax.png)