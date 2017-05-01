---
layout: post
title: 假期做了下前端面试题
category: Hellocode
keywords: 前端
description: 
---

五一三天假，眼看快结束了，也没出去人挤人，除了玩游戏，突然想起周五的时候看到sf的一道问题（实际不算问题），题主吐槽出的三道面试前端三年经验的题目，结果能做出来的寥寥无几.

题目大概如下：

1. 实现方法，去除数组中重复元素，不需要返回值，直接修改原始值
2. 实现读取页面的所有节点：即实现document.getElementsByTagName('*') 或者 实现方法深度拷贝对象
3. 实现拖拽效果

讲真，这要是不让我查一下api，纯手写，除了第一题，剩下的我也搞不定。题主要求是在不搜索的情况下做出来，我觉得我能知道大概怎么做，但还是避免不了对api方法的不熟悉，一个知识点，经常使用的话，你肯定记得，但我认为在时间推移下，我都无法完全记起这些api怎么写，于是慢慢的我开始做笔记，而且特别是一些容易混淆的api用法，主要就是为了后面又忘了可以翻开看看。

说回这几道题，其实也并不难，思考一下突破点：

1. 数组遍历，删除重复元素，理解函数参数值传递特性
2. 获取子节点方法和判断元素类型
3. 深度拷贝，递归操作，处理数组遍历
4. 鼠标按下和放开事件、鼠标移动事件和鼠标坐标值

具体实现代码如下：

实现方法，去除数组中重复元素，不需要返回值，直接修改原始值：

{%highlight javascript%}
var s = [1,2,3,2,3,4,5,6,4,5,8];

function unique(list){
  for(var i = list.length-1;i>=0;i--){
    if(list.indexOf(list[i])!=i){
      list.splice(i,1);
    }
  }
}
unique(s);
s;
{%endhighlight%}

知识点：

1.  对象（数组也是对象）作为参数时，在函数内部对参数进行内部数据变更会直接反应到实参身上，但是，如果采用了重新赋值的方式覆盖实参，那是无效的。
2. 查找数组元素索引值
3. 删除数组元素 splice


实现读取页面的所有节点：即实现document.getElementsByTagName('*')

{%highlight javascript%}
function getTags(){
  
  var nodes = [];

  function getChildNodes(parent){
    var childs = parent.childNodes;
    if(childs.length){
      [].forEach.call(childs,function(item, index){
        if(item.nodeType == 1){
          nodes.push(item);
          getChildNodes(item);
        }
      });
    }
  }

  getChildNodes(document);

  return nodes;
}
{%endhighlight%}

知识点：

1. childNodes获取子节点
2. nodeType节点类型


实现深度拷贝对象方法：我这里只考虑了数组跟对象

{%highlight javascript%}
var obj = {a:1,b:2,c:{a:2}};

//判断属性，如果是obj就递归调用，如果是数组，遍历数组调用
function copyObj(obj){
  var res;
  if(Array.isArray(obj)){
    res = [];
    obj.forEach(function(e){
      res.push(copyObj(e));
    });
  }else if(typeof obj == 'object'){
    res = {};
    for(e in obj){
      res[e] = copyObj(obj[e]);
    }
  }else{
    res = obj;
  }
  return res;
}
{%endhighlight%}

实现拖拽效果：

<iframe width="100%" height="400" src="//jsfiddle.net/dont27/3xwdsgy0/embedded/result,js,html,css/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

{%highlight html%}
<!DOCTYPE html>
<html>
<head>
  <title>test</title>
  <style type="text/css">
    #app{
      width: 800px;
      margin:50px auto;
      position: relative;
    }
    .drag{
      position: absolute;
      top: 20px;
      left: 30px;
      cursor: crosshair;
      border: 1px solid #000;
      padding: 5px;
      width:20px;
      height:20px;
      background-color:red;
    }
  </style>
</head>
<body>
  <div id="app">
    <div class="drag"></div>
  </div>
  <script type="text/javascript">
    (function(){
      function getStyle(elem){
        return getComputedStyle(elem);
      }
      function parsePx(str){
        if(/px/.test(str)){
          str = str.replace(/px/,'');
        }
        return parseFloat(str);
      }
      var drag = document.querySelector('.drag');
      var top,
        left,
        currentX,
        currentY,
        moving = false;
      drag.onmousedown = function(event){
        var css = getStyle(drag);
        top = parsePx(css.top);
        left = parsePx(css.left);
        //console.log('down',top,left);
        currentX = event.clientX;
        currentY = event.clientY;
        moving = true
      };
      document.onmouseup = function(event){
        //console.log('up');
        moving = false;
        currentX = currentY = top = left =0;
      };
      drag.onmousemove = function(event){
        if(!moving)return;
        drag.style.top = top + (event.clientY - currentY) + 'px';
        drag.style.left = left + (event.clientX - currentX) + 'px';
      };
      drag.onmouseleave = function(event){
        moving = false;
        currentX = currentY = top = left =0;
      };
    })()
  </script>
</body>
</html>
{%endhighlight%}

