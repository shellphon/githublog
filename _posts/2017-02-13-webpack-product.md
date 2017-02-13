---
layout: post
title: webpack产出代码模块化浅析
category: Hellocode
keywords: webpack,amd
description: 浅析webpack的模块化代码
---

最近整理走读了一下`webpack`产出的模块化代码，于是做一下记录，还没遇到过复杂的情况，只是浅析一下。

在写node代码的时候，模块化很自然，就是要封装模块的js，最后`module.exports=xxx`，在引用的时候`require('xxx')`即可，而在浏览器端的情况下，一般封装模块的js最后会套上一层`function`如下：

{%highlight javascript%}
function(module, exports){
    var t = {};
    module.exports = t;
}
{%endhighlight%}

这个方法执行体在执行之后返回了一个module对象，其包含了被封装好的内容。

而用webpack产出的模块化代码基本是这样的

{%highlight javascript%}
(function(modules) { // webpackBootstrap
    // install a JSONP callback for chunk loading
    var parentJsonpFunction = window["webpackJsonp"];
    window["webpackJsonp"] = function webpackJsonpCallback(chunkIds, moreModules) {
        // add "moreModules" to the modules object,
        // then flag all "chunkIds" as loaded and fire callback
        var moduleId, chunkId, i = 0, callbacks = [];
        for(;i < chunkIds.length; i++) {
            chunkId = chunkIds[i];
            if(installedChunks[chunkId])
                callbacks.push.apply(callbacks, installedChunks[chunkId]);
            installedChunks[chunkId] = 0;
        }
        for(moduleId in moreModules) {
            modules[moduleId] = moreModules[moduleId];
        }
        if(parentJsonpFunction) parentJsonpFunction(chunkIds, moreModules);
        while(callbacks.length)
            callbacks.shift().call(null, __webpack_require__);
        if(moreModules[0]) {
            installedModules[0] = 0;
            return __webpack_require__(0);
        }
    };

    // The module cache
    var installedModules = {};

    // object to store loaded and loading chunks
    // "0" means "already loaded"
    // Array means "loading", array contains callbacks
    var installedChunks = {
        3:0
    };

    // The require function
    function __webpack_require__(moduleId) {

        // Check if module is in cache
        if(installedModules[moduleId])
            return installedModules[moduleId].exports;

        // Create a new module (and put it into the cache)
        var module = installedModules[moduleId] = {
            exports: {},
            id: moduleId,
            loaded: false
        };

        // Execute the module function
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

        // Flag the module as loaded
        module.loaded = true;

        // Return the exports of the module
        return module.exports;
    }

    // This file contains only the entry chunk.
    // The chunk loading function for additional chunks
    __webpack_require__.e = function requireEnsure(chunkId, callback) {
        // "0" is the signal for "already loaded"
        if(installedChunks[chunkId] === 0)
            return callback.call(null, __webpack_require__);

        // an array means "currently loading".
        if(installedChunks[chunkId] !== undefined) {
            installedChunks[chunkId].push(callback);
        } else {
            // start chunk loading
            installedChunks[chunkId] = [callback];
            var head = document.getElementsByTagName('head')[0];
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.charset = 'utf-8';
            script.async = true;

            script.src = __webpack_require__.p + "build/" + ({"0":"app","1":"autil","2":"app1"}[chunkId]||chunkId) + ".chunk.js";
            head.appendChild(script);
        }
    };

    // expose the modules object (__webpack_modules__)
    __webpack_require__.m = modules;

    // expose the module cache
    __webpack_require__.c = installedModules;

    // __webpack_public_path__
    __webpack_require__.p = "";
 })
 ([
/* 0 */,
/* 1 */
/***/ function(module, exports) {
    module.exports = {
       
    };
 }
 ]);
{%endhighlight%}

这段代码是我用到了webpack抽取公共模块时产出的公共代码部分，里面包含了模块化的内容以及公共module。

可以看到方法是一个自执行函数，参数为modules (实际上，带入了moduleId为1的公共模块的函数)

定义了`webpackJsonp`、`__webpackRequire__`两个方法，为方便起见，简称`wpJsonp`和`wpRequire`, `wpRequire`还有个`ensure`属性方法，用于异步加载模块。

另外，还用上了两个变量`installedModules` `installedChunks`.

中间用到的id类参数有`moduleId`和`chunkId`。

通过走读代码，基本的联系图如下：

![image](http://dont27.qiniudn.com/webpackcode.png)
<a href="http://dont27.qiniudn.com/webpackcode.png" target="_blank">查看原图</a>

入口文件entry以及需要异步加载的模块js都被编译成`webpackJsonp()`的函数执行结构，`wpJsonp`的主要作用，就是将模块的执行内容存放到modules中，以方便`wpRequire`的时候，需要的模块能被找到执行体并初始化生成对应的module模块，在这个过程中，`moduleId`就是模块执行体以及模块对象的索引值。

另外`wpJsonp`还有一个逻辑是执行chunk的回调，即异步加载模块在加载完成并执行时，会触发执行`wpRequire.ensure`时加入的回调内容。在这过程中，ensure主要负责的是将回调收集（模块正在加载中）或者执行回调（之前已经加载过了）或者开辟缓存位置（installedChunks）并启用`script`加载js。而`chunkId`主要为入口文件或者异步加载文件的索引值。

代码走读过程比较绕，但经过整理一遍之后就明确了不少。

关于`installedModules`变量，用于存储加载好的模块对象，当对应索引的内容为0时，没有含义，因为逻辑在判断if时认识其没有模块，所以要去 加载模块，跟初始化时加载模块是一样的。而当加载完模块后，则会保存对应的module对象。

关于`installedChunks`变量，用于标记chunk的加载状态，主要用于异步加载，当对应索引的内容为0时，表示该chunk已经加载过了，如果正在加载，则为数组（回调函数数组）。当chunk在 `wpJsonp`执行时加载已经完成，其逻辑也会去判断回调，统一执行回调，并将对应标识置零。

