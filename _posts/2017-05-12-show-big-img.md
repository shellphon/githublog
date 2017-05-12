---
layout: post
title: 对于点击小图放大显示的见解
category: Hellocode
keywords: 前端
description: 
---

在涉及到很多图片的页面，经常是页面显示图片的缩略小图，然后通过鼠标点击，打开浮层，浮层内展示缩略图的原图，这是一个很常见的需求了，之前做过一个组件，主要就是实现这一块的，不过当初在刚拿到需求的时候，还是纠结了一段时间，主要是图片长宽跟浮层长宽之间的关系问题，当时一直没弄懂，碰巧昨天有朋友问起，于是我再找回代码时，又看了一遍。

大体上，放大图片的显示，一般都是小图跟大图之间存在一定的联系，通过小图的点击事件触发，展示浮层，浮层里获取大图的地址，并展示img标签，同时处理下大图在浮层中的居中情况。浮层一般固定宽高，而大图很多时候我们在编程时并不知道其实际的宽高，需要js去获取图片时，再获取其宽高，然后再根据浮层之间的关系来设定图片的居中情况。

按照之前写的组件，分两种情形，一个是pc端的，浮层宽高相等（正方形）。所以内部的图片，只要知道其宽高更长的那部分，以其设定父元素容器的100%，即可，这样短的一方，肯定不会被浮层截断，假设浮层是500px * 500px, 大图为 600px * 300px. 那么则是给大图设定`width:100%; height:auto;` 这样，大图在展示时展示尺寸则为 500px * 250px.

大概代码如下：基于jquery

{%highlight javascript%}
//大图加载事件
img.load(function(){
    // 这里一般放个loading隐藏
    // 此时可以获取图片宽高
    var width = img.width(),
      height = img.height(),
      // 父层高 因为宽高一致，所以只用一个值
      wrHeight = wrapper.height(),
      top,left;
    
    // 如果宽高都不超过父层，不存在被截断的情况，所以绝对定位，获取偏移值
    if(width<=wrHeight&&height<=wrHeight){
      top = (wrHeight-height)/2;
      left = (wrHeight-width)/2;
      img.css({
        top: top,
        left: left,
        visibility:'visible'
      });
    }else{
      //宽高其中一个父层宽高
      if(width>=height){
        img.css({
          width:'100%'
        });
        // 因为重新设置了宽，所以高度按比例重置了，需要重新获取
        // 不过其实可以一开始记录宽高比例，直接拿父层宽跟比例来计算高的值
        // 还省了dom高度获取操作
        height = img.height();

        top = wrHeight>height?(wrHeight - height)/2:0;
        
        img.css({
          top: top,
          visibility:"visible"
        });

      }else{
        //对高>宽的情况，高度100%，水平居中直接用margin即可
        img.css({
          margin: '0 auto',
          height:'100%',
          visibility:"visible"
        });
      }
    }
});
{%endhighlight%}

父层宽高不等的情况如何呢？

其实也是很简单，纠结只是把事情想复杂了而已。

这么想，假设浮层宽高分别是w\h,（触屏版一般就是手机屏幕的宽高）其比例为 `w/h`, 而大图为bw\bh.

当 bw < w 且 bh < h 时，也就是跟pc的做法一样，计算偏移值即可。

剩下的，其实跟pc分成两种情况一样，也是分成两种情况，只是判断条件变成了判断比例，假如父层宽高比大于大图的宽高比时，当我们设置`width:100%`时，大图的展示高度势必会大于父层高度，不可取，而设置`height:100%`时，刚好图片的展示宽度小于父层宽度，可以正常展示。反过来，当父层宽高比例小于大图的宽高比例时，设置`width:100%;`时，能保证图片的展示高度小于父层高度。

于是如下代码：基于jquery或者zepto

{%highlight javascript%}
img.on('load',function() {
  var width = img.width(),
    height = img.height(),
    top, left;
    
    //图片实际比屏幕小
    if(width<=docWidth&&height<=docHeight){
      top = (docHeight - height)/2;
      left = (docWidth - width)/2;
      img.css({
        top:top,
        left:left,
        visibility:'visible'
      });
    }else{
      //图片实际宽高比大于父层容器宽高比时
      if(width*docHeight>=height*docWidth){
        img.css({
          width:'100%'
        });
        height = img.height();
        top = height>=docHeight?0:(docHeight-height)/2;
        img.css({
          top:top,
          visibility:'visible'
        });
      }else{
        img.css({
          margin:'0 auto',
          height:'100%',
          visibility:'visible'
        });
      }
    }
})
}
{%endhighlight%}

本来想画图的，发现好像不知道怎么画。。。