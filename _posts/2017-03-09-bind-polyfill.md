---
layout: post
title: 理解bind的实现原理
category: Hellocode
keywords: bind,polyfill
description: 理解bind的实现原理
---

感觉应该坚持一个月至少产出一篇博客文章来， 碰巧在sf看到一个关于`bind`的问题，又回到去年看过[MDN关于bind实现的polyfill](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_objects/Function/bind)，当时看得一脸懵逼，如今对原型链使用有进一步的认识了，于是记一下笔记（原来之前没做笔记）并总结一下。

首先关于`bind`的使用，就是将函数转变为一个新的函数，而这个新的函数在调用过程中，自带bgm，哦不，自带指定的`this`。

我们知道，一个函数里，有两个很重要的概念，一个是`arguments` 函数参数对象，另外一个就是`this`，指向函数所属对象。

当我们声明一个函数时，在调用过程中，内部`this`往往指向于`window`（浏览器环境下），因为这个函数作为普通函数被直接调用时，属于全局调用，所以此时它的`this`指向全局对象即`window`. PS: 虽然我更想理解成普通函数a，可以用`window.a`来理解，但是如果是在自执行函数里面声明的function，对不起，它不在window里，所以这样理解无效。

而如果是一个对象里的函数，在调用这个对象调用自己成员函数的时候，其`this`指向于自己，但如果单独把这个函数抽离过来使用，`this`又不一定指向原来的对象了。

{%highlight javascript%}
    var test = 'hi';
    var obj = {
        test:'hello',
        f:function(){
            console.log(this.test);
        }
    };
    var outf = obj.f;
    obj.f(); // hello
    outf();// hi
{%endhighlight%}

此时，`bind`就是意在让`function`自带`this`的神器。

{%highlight javascript%}
    var test = 'hi';
    var obj = {
        test:'hello',
        f:function(){
            console.log(this.test);
        }
    };
    var outf = obj.f;
    
    var outbindf = obj.f.bind(obj);

    obj.f(); // hello
    outf();// hi
    
    outbindf();//居然是hello了
{%endhighlight%}

看起来`bind`很强大，但是低版本浏览器，特别是ie9-，就没有`bind`这个方法。

没事，没轮子我们自己造，我们可以通过给`Function`原型加上`bind`属性方法来实现，运用currying的方式（生成一个新函数）、闭包和`apply`来实现`this`的绑定。

同时，我们要考虑到当原函数作为构造函数来使用，`bind`产出的函数也当构造函数来`new`的时候，需要忽略绑定的`this`了，也就是`bind`的原始作用移除。

来看一下`MDN`的polyfill实现：

{%highlight javascript lineno%}
if (!Function.prototype.bind) {
  Function.prototype.bind = function(oThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }

    var aArgs   = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP    = function() {},
        fBound  = function() {
          return fToBind.apply(this instanceof fNOP
                 ? this
                 : oThis,
                 aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    if (this.prototype) {
      // Function.prototype doesn't have a prototype property
      fNOP.prototype = this.prototype; 
    }
    fBound.prototype = new fNOP();

    return fBound;
  };
}
{%endhighlight%}

按顺序看，首先第一点就是判断是否有`bind`了，如果有，就没下面什么事了（这么快就领便当）。

最外层的function内，`this`指向的即原函数本身，那么首先会判断这个原函数是不是可执行的，如果不是，bind了也没意义，于是报错。有点疑惑，既然都能访问到`Function.prototype`了，这个原函数难道还不是`function`么？这个问题[这里有解答](http://stackoverflow.com/questions/34867026/if-we-polyfill-fn-bind-in-javascript-why-do-you-have-to-check-the-type-of-th)

其实就是这样：

{%highlight javascript%}
var notAFunction = {};
var someObject = {};

Function.prototype.bind.call(notAFunction, someObject);
{%endhighlight%}

间接的通过`call`或者`apply`来调用`bind`时，内部`this`指向了`notAFunction`了！！！

后面变量分析：

`aArags`主要用于把bind时剩余的参数作为补充参数，在调用新函数时整合参数来调用。

`fToBind`为原函数，`fNOP`为中介，一个纯函数，并且在第19行处将其原型链指向到原函数的原型链，这个干吗用呢？

`fBound`就是新函数了，它其实内部是调用`fToBind`，并且绑定了`this`，并返回执行结果。

而在`this`的选取中，通过判断 原函数是否为`fNOP`实例来决定用`this`还是绑定指定对象。

`fBound.prototype = new fNOP();`这句使得，当`new fBound()`即new调用新函数时，其`this`即为`fNOP`的实例，从而达到新函数作为构造函数调用时，无视原来要绑定的`this`.

再回过头来，看看关于`fNOP.prototype = this.prototype; `,因为最后`fBound`的原型链指向`fNOP`的实例，而`fNOP`的原型链又指向原函数的原型。 如此一来，当新函数产生的实例对象，也能访问到原函数的原型链去了。

具体例子如下：

{%highlight javascript%}
Function.prototype.bind1 = function(ctx){
    var me = this;
    var args = Array.prototype.slice.call(arguments, 1);
    var F = function(){};
    F.prototype = this.prototype;
    var bound = function(){
        var innerArgs = Array.prototype.slice.call(arguments);
        var finalArgs = args.concat(innerArgs);
        return me.apply(this instanceof F ? this : ctx||this, finalArgs);
    }
    bound.prototype = new F();
    return bound;
}
//不做指向原函数的原型
Function.prototype.bind2 = function(ctx){
    var me = this;
    var args = Array.prototype.slice.call(arguments, 1);
    var F = function(){};
    //F.prototype = this.prototype;
    var bound = function(){
        var innerArgs = Array.prototype.slice.call(arguments);
        var finalArgs = args.concat(innerArgs);
        return me.apply(this instanceof F ? this : ctx||this, finalArgs);
    }
    bound.prototype = new F();
    return bound;
}

var simple = function(){
    console.log('simple called: test = ',this.test);
};

var obj = {
    test:"obj's test"
};

var bSimple = simple.bind1(obj);
bSimple();//simple called: test =  obj's test

var bSimple2 = simple.bind2(obj);
bSimple();//simple called: test =  obj's test

var son = function(){
    console.log('son called: test = ',this.test);
};

var father = function(){
    console.log('father called');
    this.test = 'father test';
};

son.prototype = new father();//father called

var son1 = son.bind1(obj);
new son1(); //son called: test =  father test

var son2 = son.bind2(obj);
new son2(); //son called: test =  undefined

{%endhighlight%}

如果原函数没有更多的原型链指向，直接新函数构造的实例是可以访问到原函数内的属性的，但是如果原函数还有其他原型指向，要想访问原型链上的属性，那bind的实现里就必须带上原函数的原型链处理。