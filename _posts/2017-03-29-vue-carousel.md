---
layout: post
title: vue实现旋转木马轮播
category: Hellocode
keywords: vue, carousel
description: vue实现旋转木马轮播
---

同事拿到个设计稿,是旋转木马的轮播效果,于是网上找了一下,发现了[jquery实现的效果](http://www.softwhy.com/demo/code/600/#),一有空就看看源码，研究其实现原理，想着用vue的数据驱动方式来实现一个，但这个效果跟以往做的demo效果不同，每次思考实现都被卡住了。拖延了好些日子，后来脑子一转，居然想到方案了，于是动手实现了下。

关于旋转木马效果实用例子：一个实际应用在优酷的[频道页](http://zy.youku.com/)。

首先分析一下`jquery`的实现效果，其实是将轮播项的dom进行左右分组，并设定好每个dom的宽高、层叠参数、透明度以及位置偏移，然后通过jquery的动画api，对dom组进行一个数据切换（复制下一个dom的数据）。比如现在有A\B\C三个，B在中间，当右往左切换时，B获取C的数据，而C拿A的数据，而A替换B的数据，变成B\C\A.

#### 关于计算

插件接受指定的几个数据：整体宽高，主项宽高（中间最大），其他项依次缩小的比例。

关于位置，如图：

![image](http://dont27.qiniudn.com/carousel.png)
<a href="http://dont27.qiniudn.com/carousel.png" target="_blank">查看原图</a>

主项应该是居中的，所以其位置偏移（绝对定位）左边相对于父元素来说，应该是整体宽度和自身宽度之差的一半。而两边的其他项，直接相隔则按数目等分剩余空间。比如假设父元素宽度800px，主项宽度400px，左边剩余空间应该宽为(800-400)/2=200px,而假设左边有两项，则二者直接等分展示自身部分为200/2=100px;这个数值就是我们要考虑的绝对定位left值，同理可得右边部分的left值，至于项目的居中绝对定位，也是类似的道理，更加简单。

其次，考虑的是以中间为主项，往两边的项应该层叠参数(z-index)越靠中间，值越大，透明度越往两边值越小。具体代码逻辑可从[这里](https://github.com/LikaiLee/Carousel)找到。

#### vue实现

vue的理念是数据驱动，所以要把jquery插件那套实现做一下转化。同样，也是接受几个静态数据：整体宽高、中间项宽高、缩小比例。

{%highlight html%}
<cascade-loop :list="list" :cur-width="400" :all-width="800" :all-height="300"
    :cur-height="280" :scale="0.8"
    ></cascade-loop>
{%endhighlight%}

将jquery对dom的数据操作转化为数组`store`，数组元素存储各项dom的数据（宽高、绝对定位偏移值、透明度以及层叠参数），在模板处遍历实际项目的数组，其样式则通过索引获取对`store`数组的元素数据。

切换数据通过对`store`进行出队、入队或反向出队和入队操作以达到切换逻辑；再通过样式设定`transition`来设置动画效果即可。

{%highlight css%}
.item{
  transition: all .8s ease;
}
{%endhighlight%}

对于数据的初始化，代码如下：

{%highlight javascript%}
 //store数组
 var items = [];

 //拷贝物理数据
 var rlist = copyArr(this.list);

 //获取中间数组元素索引
 var level = Math.floor(this.list.length/2);

 //如果数据是偶数则拷贝多一个数据.
 if(this.list.length%2==0){
    var center = this.list[0];
    rlist.push(Object.assign({},center));
 }
 
  //左边部分
  var lefts = rlist.slice(0,level);
  //右边部分
  var rights = rlist.slice(level);
  var that = this;
  //两边剩余空间（单边）
  var leftGap = (this.allWidth - this.curWidth)/2;
  //等分剩余空间，即间隙
  var gap = leftGap/level;
  lefts.forEach(function(e,i){
    //遍历左边部分
    var obj = {};
    //从左往右，其left值是gap倍数增长
    obj.left = i*gap;
    //层叠参数逐级增1
    obj.zIndex = i+1;
    //透明度则简单做逐级增大
    obj.opacity = 1/(level+1-i);
    //宽高则按距离中间项的个数来选择缩放
    obj.width = that.curWidth*Math.pow(that.scale,level-i);
    obj.height = that.curHeight*Math.pow(that.scale,level-i);
    //底部距离取最大高与当前项高差的一半
    obj.bottom = (that.allHeight-obj.height)/2;
    items.push(obj);
  });
  //遍历右边部分，包含中间项
  rights.forEach(function(e,i){
    var obj = {};
    obj.width = that.curWidth*Math.pow(that.scale,i);
    obj.height = that.curHeight*Math.pow(that.scale,i);
    //偏移值可以反向思考，通过全宽减去距离右边偏移以及自身宽度
    obj.left = that.allWidth - (level-i)*gap - obj.width;
    obj.zIndex = level-i+1;
    obj.opacity = 1/(i+1);
    obj.bottom = (that.allHeight-obj.height)/2;
    items.push(obj); 
  });

  return {
    items:items,
    rlist:rlist,
    timer:null,
    dir:'right'
  }
{%endhighlight%}

加上定时器和方向选择，效果就出来了，如下：

<iframe width="100%" height="400" src="//jsfiddle.net/dont27/Lmoj6uq0/14/embedded/result,js,html,css/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

访问不了可以看[runjs](http://sandbox.runjs.cn/show/bduq4pz5).

刚开始一直思维绕不过去，一直无从下手，然而当抓到突破点的时候，其实写出来，发现挺简单的！

不过在偶数项处理方面，我只是简单做一下拷贝多一份的处理，比较粗暴！