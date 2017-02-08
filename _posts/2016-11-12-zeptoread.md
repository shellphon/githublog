---
layout: post
title:  zepto源码读后感
category: Hellocode
keywords: zepto, sourcecode
description: 
---

之前花了一个多月时间看jquery2的代码，真的复杂，一些逻辑实现做了代码复用而失去可读性，读起来真的累。

后来开始看zepto1.2.x的源码，这个移动端的jquery，内容少了，需要考虑的兼容性少了，代码实现也好看多了。

大概代码结构：
 
zepto整体:
{%highlight javascript%}
(function(global, factory){...})(this, fucntion(window){
 //...
 return Zepto;
 });
{%endhighlight%}
  
1. `var Zepto = {};//基础`
2. window.Zepto = Zepto;
3. window.$ === undefined && (window.$ = Zepto)
4. `(function($){...})(Zepto)//event模块`
5. `(function($){...})(Zepto)//ajax模块`
6. `(function($){...})(Zepto)//表单方法`
7. `(function($){...})() //getComputedStyle 重写方法 `

其内部主要的对象结构大致如图所示：

![image](http://dont27.qiniudn.com/zepto.png)
<a href="http://dont27.qiniudn.com/zepto.png" target="_blank">查看原图</a>

Zepto即$, 内部方法Z负责整合集合，init方法负责获取dom集合，原型修正则使得Zepto对象拥有$.fn的方法，即对象方法，而Zepto类还包含静态方法。

关于原型修正，表面上看着有点绕，但实际上明白其用意之后，后面见到就见怪不怪了。

Zepto的选择器，与jquery2的选择器也是类似的，因为少了ie旧版的兼容，可以更好的直接采用querySelectorAll等方法直接获取选择器，方便。

关于最后对getComputedStyle的重写的见解：

{%highlight javascript%}
;(function(){
  // getComputedStyle shouldn't freak out when called
  // without a valid element as argument
  try {
    getComputedStyle(undefined)
  } catch(e) {
    var nativeGetComputedStyle = getComputedStyle;
    window.getComputedStyle = function(element){
      try {
        return nativeGetComputedStyle(element)
      } catch(e) {
        return null
      }
    }
  }
})()
{%endhighlight%}

起初刚开始看时，对其很不解，后来才理解，因为该方法直接调用不传参时会报错，所以通过重写，提前捕获这类报错，更合理。

zepto较之jquery，少了data方法的缓存处理，即jquery并非直接往dom节点添加data属性，而是通过自身实现的数据缓存模块来操作，精妙而好用。zepto则没有。
