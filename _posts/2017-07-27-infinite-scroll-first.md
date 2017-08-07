---
layout: post
title: 初探滚动加载实现和优化点
category: Hellocode
keywords: infinite-scroll, dom-collection, waterfall
description: 滚动加载的实现和优化知识点，绝对定位瀑布流实现
---


平时工作并没有接触到瀑布流，但说起滚动加载，触屏版列表页总会遇到，只是很多时候数据量太少，无暇考虑其存在的优化点，如果被问起，可能回答最多的是图片懒加载吧，但其实不然，也是之前的一次面试，被问及滚动加载的优化，当时面试官很详细的说明需求，那就是页面在不断下拉滚动加载过程中，dom的不断增加会加大内存消耗， 如果是手机的话，会有卡顿的现象出现，这个时候应该怎么处理？

<style>
  svg.process{width:400px;height:400px;margin:0 auto}svg.infscroll{vector-effect:non-scaling-stroke}svg.infscroll *{vector-effect:inherit}#browser .viewport{stroke:red;stroke-width:4;fill:none}#browser .viewport text{stroke:none;fill:red}.whitener{stroke:none;fill:rgba(255,255,255,0.54)}#runway{stroke:url(#linear);stroke-width:2;fill:none}#runway+text{fill:blue;stroke:none}.pages>use{stroke:none;fill:none}.pages>use:nth-child(1){animation:page1 10s infinite}.pages>use:nth-child(2){animation:page2 10s infinite}.pages>use:nth-child(3){animation:page3 10s infinite}.pages>use:nth-child(4){animation:page4 10s infinite}.pages>use:nth-child(5){animation:pagew1 10s infinite}.pages>use:nth-child(6){animation:pagew2 10s infinite}.pages>use:nth-child(7){animation:pagew3 10s infinite}.pages>use:nth-child(8){animation:pagew4 10s infinite}.pages{animation:items 10s infinite}@keyframes items{0%{transform:translateY(0px)}16%,20%{transform:translateY(-80px)}32%,36%{transform:translateY(-480px)}48%,52%{transform:translateY(-800px)}64%,68%{transform:translateY(-880px)}80%,84%{transform:translateY(-802px)}96%,100%{transform:translateY(-480px)}}@keyframes page1{0%{stroke:#000;fill:yellow}16%,20%{stroke:#000;fill:yellow}32%,36%{stroke:#000;fill:yellow}48%,52%{stroke:#000;fill:none}64%,68%{stroke:#000;fill:none}80%,84%{stroke:#000;fill:yellow}96%,100%{stroke:#000;fill:yellow}}@keyframes page2{0%{stroke:none;fill:none}16%,20%{stroke:#000;fill:yellow}32%,36%{stroke:#000;fill:yellow}48%,52%{stroke:#000;fill:yellow}64%,68%{stroke:#000;fill:yellow}80%,84%{stroke:#000;fill:yellow}96%,100%{stroke:#000;fill:yellow}}@keyframes page3{0%{stroke:none;fill:none}16%,20%{stroke:none;fill:none}32%,36%{stroke:#000;fill:yellow}48%,52%{stroke:#000;fill:yellow}64%,68%{stroke:#000;fill:yellow}80%,84%{stroke:#000;fill:yellow}96%,100%{stroke:#000;fill:yellow}}@keyframes page4{0%{stroke:none;fill:none}16%,20%{stroke:none;fill:none}32%,36%{stroke:none;fill:none}48%,52%{stroke:none;fill:none}64%,68%{stroke:#000;fill:yellow}80%,84%{stroke:#000;fill:yellow}96%,100%{stroke:#000;fill:none}}
  .item1{animation:move1 9s infinite}.item2{animation:move2 9s infinite}.item3{animation:move3 9s infinite}.item4{animation:move4 9s infinite}.item5{animation:move5 9s infinite}.item6{animation:move6 9s infinite}.line{animation:line 9s infinite}@keyframes move1{0%{transform:translate(0px,0px)}10%,100%{transform:translate(200px,0px)}}@keyframes move2{0%,10%{transform:translate(0px,0px)}20%,100%{transform:translate(320px,-110px)}}@keyframes move3{0%,20%{transform:translate(0px,0px)}40%,100%{transform:translate(440px,-280px)}}@keyframes move4{0%,40%{transform:translate(0px,0px)}60%,100%{transform:translate(440px,-290px)}}@keyframes move5{0%,60%{transform:translate(0px,0px)}80%,100%{transform:translate(200px,-410px)}}@keyframes move6{0%,80%{transform:translate(0px,0px)}90%,100%{transform:translate(320px,-580px)}}@keyframes line{0%,40%{transform:translateY(0px)}50%,60%{transform:translateY(50px)}65%,80%{transform:translateY(100px)}85%,90%{transform:translateY(150px)}98%,100%{transform:translateY(210px)}}
</style>

当时我并没有想到dom回收这块去，最后一句“不会要把前面dom给删了先吧？”，面试官回道“就是这样”……最终面试结束就没有消息了，当时我就开始研究瀑布流跟这个dom回收的优化点，但总是碎片化时间来思考，遇到问题后停了很长一段时间，最近又去研究类似实现网站的做法，于是找到突破点，较为完整地写完了代码。

接下来，我分两部分阐述本文主题：瀑布流实现、dom回收。

### 绝对定位的瀑布流

这里实现，基本参考了博客文章 [http://www.cnblogs.com/xueming/archive/2013/02/19/flow.html](http://www.cnblogs.com/xueming/archive/2013/02/19/flow.html) 文章内容其实已经很清晰了，一步一步教到尾。

我这里总结一下自己实现的知识点：

1.绝对定位布局瀑布流，每个数据项的位置都固定，这里先设定好每一排的列数，先布局第一排数据，然后记录下每一项的高度，并将高度值存到一个数组中，后续的数据项每次摆放，其实都是 通过取得数组元素最小值来决定数据项的位置，这样就能保证后续数据都是优先插入到剩余空间（无视其标签在代码里的物理位置）。绝对定位还有一个好处是后面如果dom回收的话，前面dom清除也不会影响后面dom的布局。

示意图如下：[额外链接>>](http://runjs.cn/detail/urakrqoq) (需要支持svg和动画的浏览器)

<svg class="process" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 800 1200" >
  <rect x="0" y="0" width="800" height="1200" fill="#fff" ></rect>
  <rect x="200" y="10" width="400" height="1000" stroke='red' stroke-width='4' fill="#fff" ></rect>
  
  <rect class="item1" x="10" y="10" width="100" height="100" stroke='#eee' stroke-width='2' fill="#999" ></rect>
  <rect class="item2" x="10" y="120" width="100" height="150" stroke='#eee' stroke-width='2' fill="#999" ></rect>
  <rect class="item3" x="10" y="290" width="100" height="50" stroke='#eee' stroke-width='2' fill="#999" ></rect>
  
  <rect class="item4" x="10" y="360" width="100" height="150" stroke='#eee' stroke-width='2' fill="#999" ></rect>
  <rect class="item5" x="10" y="530" width="100" height="200" stroke='#eee' stroke-width='2' fill="#999" ></rect>
  <rect class="item6" x="10" y="750" width="100" height="130" stroke='#eee' stroke-width='2' fill="#999" ></rect>
  <line class="line" x1='120' y1='10' x2='680' y2='10' stroke='blue' stroke-width="4" stroke-dasharray="20 10"></line>
</svg>

2.数据项带有图片势必需要异步操作，因为是滚动加载，可以不考虑懒加载了，既然是异步，会影响第一点说得获取数据项高度的进度，于是转换一下思路，当我们拿到数据的那一刻，先把图片地址筛选出来，并行js代码加载图片（不显示），直到最后一张图片加载完成时回调来进行dom插入以及布局位置操作。

3.滚到哪里才触发加载？自然是当可视区域底部接近当前高度数组最低值处开始触发加载。

由于瀑布流需要大量数据，只是做初探，我简单的封装了一个对象，构造一个数组存放图片地址数据，当然图片地址只是抽取几个随机复制而已。并提供了一个延迟异步获取数据的方法，用以模拟异步加载接口数据。如下：

{%highlight javascript%}
var testData = (function(){
    var res = {
      cur:0,//游标
      timeout: 300,//模拟异步加载数据时间
      dataLength:500,
      data:null,
      init:function(){
        var imgArr = ['http://ww2.sinaimg.cn/mw1024/687c9d70gw1ers20bgbmfj20jp0iy75y.jpg',
        'http://ww1.sinaimg.cn/mw1024/687c9d70gw1f58v3qt61xj21hc0swnb0.jpg',
        'http://ww2.sinaimg.cn/mw1024/687c9d70jw1esarn32h12j21kw0w2awn.jpg',
        'http://ww4.sinaimg.cn/mw1024/687c9d70jw1etrxtg2lfyj20p018dwnm.jpg',
        'http://ww3.sinaimg.cn/mw1024/687c9d70jw1el3094weskj20jk0b0q4l.jpg',
        'http://wx4.sinaimg.cn/mw690/0067rZWEly1fhv6rahb41j30fz08g3z6.jpg',
        'http://wx4.sinaimg.cn/mw690/7bfc0806gy1fhu9a0jkklj20xc0xc129.jpg',
        'http://wx2.sinaimg.cn/mw690/81269f60ly1fhuznkn9isj20zi18ctby.jpg',
        'http://wx1.sinaimg.cn/mw690/c260f7ably1fhw9m4srs6j20l60zkdlv.jpg',
        'http://wx1.sinaimg.cn/mw690/98bf101bly1fhwjaht7sdj20j60lkjwj.jpg'
          ];
        var gdata = (new Array(this.dataLength)).join('#').split('#').map(function(e, i){
          return {
            src:imgArr[Math.floor(Math.random()*imgArr.length)],
            desc: i+'-'+ Math.round(Math.random()*100)
          };
        });
        this.data = gdata;
      },
      //模拟异步加载数据:暂时不考虑超过的问题
      loadData: function(length,fn){
        var data = this.data.slice(this.cur, this.cur+length);
        this.cur+=length;
        setTimeout(function(){
          fn(data);
        }, this.timeout);
      }
    };
    res.init();
    return res;
  })();
{%endhighlight%}

图片的加载：这里有点回调地狱的感觉，利用递归的方式在每个图片加载完毕之后继续下一个图片的加载，直到结束，才进行下一步的回调

{%highlight javascript%}
function loadImgs(data, cbk){
      var i = 0;
      var len = data.length;
      (function loadImg(){
          var img = new Image();
          img.onload = img.onerror = function(){
              i++;
              if(i==len){//全部加载完毕了
                  cbk(data);
              }else{
                  loadImg();
              }
          };
          img.src = data[i].src; 
      })();   
  }
{%endhighlight%}

图片加载完毕的下一个步骤，是先将dom组装并丢进容器元素中

{%highlight javascript%}
  // 生成dom字符串，并添加到容器
    function appendData(data, first){
      var domStr;
        var domArr = data.map(function(e,i){
            var date = new Date();
            var itemId = 'item_'+i+'_'+date.getTime();
            return '<div class="item" id="'
                + itemId 
                +'"><img src="'+e.src+'" /><p>' + e.desc + '</p>'+'</div>';
        });
        
        domStr = '<div class="group has-data">'+domArr.join('')+'</div>';
        first? wrap.html(domStr):wrap.append(domStr);
    }
{%endhighlight%}

item类即为一个数据项，这里加了个group父元素包裹是为了dom优化处理用，后面会说到。

dom构造完，就可以获取数据项的高度，以便调整布局。

{%highlight javascript%}
    // 流布局
    function flow(first,len){
        var group = wrap.find('.group');
        group = group.eq(group.length - 1);
        var lefts;
        var items = [].slice.call(group.find('.item'));
        if(first){//首次布局先分成首排和后续数据
          first = items.slice(0, len);
          lefts = items.slice(len);
          domFlow(first, true);
          domFlow(lefts);
        }else{
          domFlow(items);
        }  
    }
    function domFlow(doms, first){
      doms.forEach(function(e, i){
            var cur;
            e = $(e);
            var height = e.outerHeight();
            if(first){
              e.css({
                  left: iw*i+ 'px',
                  top: 0
              });
            }else{
              cur = getMinTop();
              e.css({
                  left: iw*cur.index + 'px',
                  top: cur.height + vGap + 'px'
              });
            }
            e.show();
            cur?(heightArr[cur.index] = cur.height+vGap+height)
            : heightArr[i] = height;
        });
    }
{%endhighlight%}

这里做了一个判断是首次数据排列还是后续排列，其主要不同点是，首排布局只需要关注其水平位置，垂直位置都是0起点，并初始化高度数组以便后续数据项的排列，而后续数据项垂直位置需要得到当前最短高度位置的高度值加上间隔。

基本分点逻辑阐述完，剩下的就是主流程的代码：监听滚动时只考虑向下滚动才会有触发加载数据的情况。

{%highlight javascript%}
function begin(wrapId, itemWidth, hGap, vGap){
    var wrap = $('#'+wrapId),
      wrapWidth = wrap.width(),
      //单元宽加边距
      iw = hGap + itemWidth,
      //一排能放多少个单元
      column = Math.floor((wrapWidth+hGap)/iw),
      //存放每一排的单元高度数组，用于下一排的排列
      heightArr = [],
      curLen = 0;
    var winHeight = $(window).height();
    var numGroup = column * 4;

      // 调整容器居中
      wrap.css({left: (wrapWidth - iw*column + hGap)/2 + 'px'});
      //初始化高度数组
      for(var i = 0;i < column; i++){
        heightArr.push(0);
      }
      // 第一组数据渲染
      testData.loadData(numGroup, function(tdata){
        loadImgs(tdata, function(data){
              appendData(data, true);
              flow(true, column);
          });
      });
        
        // 记录滚动值，用于区分是否向下滚动
        var stBefore = $(window).scrollTop();

      // 监听滚动事件
     $(window).bind('scroll.infinite',function(){
      scrollHandler && clearTimeout(scrollHandler);
      scrollHandler = setTimeout(function(){
        var scrollTop = $(window).scrollTop();
        if(scrollTop<stBefore){
          stBefore = scrollTop;
          return;
        }
        stBefore = scrollTop;
        // 触发加载应该是，当接近最短列高度之前就触发加载
        if(scrollTop+winHeight>getMinTop().height - 150){
            //console.log('loading');
            testData.loadData(numGroup, function(edata){
                  extraItems(edata);
                });
        }
      },200);
     });

  }
{%endhighlight%}

到这里基本瀑布流的实现就结束了。


### 优化点：dom回收

这是卡住我思路很久的一个问题，想想当时主要卡在dom回收的关键位置判断，如果分组还得考虑不做dom回收的分组最多保留几组，滚动触发时怎么去判断。

后来，我分析了一下唯品会的搜索结果页，分析了一下，发现了规律。

#### 案例：唯品会[搜索结果页](https://m.vip.com/searchlist.html?q=安踏)

其主要是将多个数据项作为一组，以组为单位，也可以视为一页。

{%highlight html%}
<div id="J-list-view" class="u-product-list" style="min-height: 1px;">
    <div class="J-list-page list-view-page" data-page="3" style="height: 4580px;" clearout="true"></div>
</div>
{%endhighlight%}


基本规则：

1.每组20个item，如果向下滚动时，保持list-view-page 有实体内容的个数在3-4，多余部分则清空内容，并设置height以及clearout=true

2.一般向下滚动的话，有实体item的list-view-page一般都为3个，当页面往回滚时，会出现实体item 的page最多四个的情况。（来回滑动过程中，假设当前页有page i和i+1, 此时具有实体的page不在可视范围的还有i-1和i+2，只有当i离开视口，i-1才会释放实体，也只有i+1顶部离开视口，i+2才会释放实体）。

3.当前可视范围内的页，需要保证其上下临近页都有实体item，假设页2在向下滑动过程中离开可视范围，那么页1实体清空，当页2往回滑动底部进入可视范围，则恢复页1的实体item，同样，往回滚动后又正向滚动，页2顶部进入可视范围时，页3恢复实体。

4.对于新加载页，规则是，假设页3最后一个item进入可视范围，则开始加载页4的内容，保证再继续滑动过程中能顺畅浏览。

这么表达貌似有点懵逼，于是用svg做了个简单的动画（可能需要用chrome才能有效果）。可以[戳这里去看代码](http://runjs.cn/detail/7zgdevpk)

<svg class="process infscroll" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 -800 800 1800" preserveAspectRatio="xMidYMid meet" style="vector-effect: non-scaling-stroke;background-color:white;"><defs><linearGradient id="linear" x1="0%" y1="0%" x2="0%" y2="1000%"><stop offset="0%" stop-color="rgba(0, 0, 255, 0)"></stop><stop offset="5%" stop-color="rgba(0, 0, 255, 1)"></stop></linearGradient><g id="page"><rect x="50" y="0" width="200" height="400"></rect>     <text class="ptext" x="60" y="50"  font-size="36">page</text></g></defs><g id="runway"><rect x="0" y="-500" width="300" height="2280"></rect></g><text x="100" y="0" transform="rotate(-90)" font-size="60">html</text><g class="pages">    <use xlink:href="#page" x="0" y="0"></use><use xlink:href="#page" x="0" y="401"></use><use xlink:href="#page" x="0" y="802"></use>    <use xlink:href="#page" x="0" y="1203"></use></g><g id="browser"><g class="viewport"><rect x="0" y="0" width="300" height="300"></rect><text x="-300" y="-32" transform="rotate(-90)" font-size="64">Viewport</text></g></g>  <g id="claim">    <text x="400" y="0" font-size="64">背景色代表page有实体内容</text>    <text x="400" fill="red" y="80" font-size="64">page滑到接近底部加载page</text>    <text x="400" y="160" font-size="64">保证可视page的临近有内容</text>  </g></svg>

由此，再总结一下大概的逻辑是：（这里保证每个分组总高度比屏幕高度要大）

1.当页面滚动事件触发，获取当前滚动位置是否即将到达瀑布流底部，是则加载新数据，否则不作为(也不是不作为，是不加载新数据)。

2.因为瀑布流分组的话，高度是不定的，所以需要将分组的顶部高度存储到一个数组（heightGroup）中。

3.不考虑什么幅度问题，滚动事件触发后，得到屏幕顶部和底部所在页面的相对位置，得出在视野内的分组（1-2个）， 假设为n和n+1, 那么n-2以及n-(2+)就需要被释放掉，另一个方向需要考虑n+1是否在视野，是则n+2以及之后的分组都要释放，否则从n+3开始算起。

关于分组的缓存以及位置，我们可以用两个数组来存储，只需要在上一步里提到的flow方法中，做记录即可

{%highlight javascript%}
//缓存每一组起点高度（当前组结尾最短位置就是下一组的起点）
var minTop = getMinTop();
cacheTop.push(minTop.height);
//缓存每一组dom
cacheDom.push(group.html());
{%endhighlight%}

根据高度值计算其在那个分组范围内:

{%highlight javascript%}
//返回指定高度所在的分组序号（0开始）
function beforeWho(height){
  var i = 0,
    len = cacheTop.length;
  for(;i<len;i++){
    if(cacheTop[i]>height){
      break;
    }
  }
  return i-1;
}
{%endhighlight%}

通过滚动事件触发，可以获得滚动高度值，即可获得可视区域的顶部和底部，再根据这两个位置得出可视区域的两个分组（或者一个），为装有数据项的分组添加has-data类做标识。

{%highlight javascript%}
//两个分组的索引值
function groupBetter(uIndex, dIndex){
    var groups = wrap.find('.group');
    
    $.each(groups,function(index, group){
      group = $(group);
      if(index==uIndex||index==uIndex-1||index==dIndex||index==dIndex+1){
        if(!group.hasClass('has-data')){
          group.html(cacheDom[index]).addClass('has-data');
        }
      }else{
        group.html('').removeClass('has-data');
      }
    });

}
{%endhighlight%}

到此，基本代码写完，下面附上完整版

{%highlight javascript%}
(function(){
  // 构造测试数据
  var testData = (function(){
    var res = {
      cur:0,//游标
      timeout: 300,//模拟异步加载数据时间
      dataLength:500,
      data:null,
      init:function(){
        var imgArr = ['http://ww2.sinaimg.cn/mw1024/687c9d70gw1ers20bgbmfj20jp0iy75y.jpg',
        'http://ww1.sinaimg.cn/mw1024/687c9d70gw1f58v3qt61xj21hc0swnb0.jpg',
        'http://ww2.sinaimg.cn/mw1024/687c9d70jw1esarn32h12j21kw0w2awn.jpg',
        'http://ww4.sinaimg.cn/mw1024/687c9d70jw1etrxtg2lfyj20p018dwnm.jpg',
        'http://ww3.sinaimg.cn/mw1024/687c9d70jw1el3094weskj20jk0b0q4l.jpg',
        'http://wx4.sinaimg.cn/mw690/0067rZWEly1fhv6rahb41j30fz08g3z6.jpg',
        'http://wx4.sinaimg.cn/mw690/7bfc0806gy1fhu9a0jkklj20xc0xc129.jpg',
        'http://wx2.sinaimg.cn/mw690/81269f60ly1fhuznkn9isj20zi18ctby.jpg',
        'http://wx1.sinaimg.cn/mw690/c260f7ably1fhw9m4srs6j20l60zkdlv.jpg',
        'http://wx1.sinaimg.cn/mw690/98bf101bly1fhwjaht7sdj20j60lkjwj.jpg'
          ];
        var gdata = (new Array(this.dataLength)).join('#').split('#').map(function(e, i){
          return {
            src:imgArr[Math.floor(Math.random()*imgArr.length)],
            desc: i+'-'+ Math.round(Math.random()*100)
          };
        });
        this.data = gdata;
      },
      //模拟异步加载数据:暂时不考虑超过的问题
      loadData: function(length,fn){
        var data = this.data.slice(this.cur, this.cur+length);
        this.cur+=length;
        setTimeout(function(){
          fn(data);
        }, this.timeout);
      }
    };
    res.init();
    return res;
  })();

  //接受参数 wrapId\hGap\vGap\itemWidth\heightArr\column
  begin('wrap', 300, 20, 20);
  var resizeHandler,
    scrollHandler;
  // 监听窗口调整
  $(window).resize(function(){
    resizeHandler && clearTimeout(resizeHandler);
    resizeHandler = setTimeout(function(){
      //console.log(document.documentElement.clientWidth,$('#wrap').width());
      $(window).unbind('scroll.infinite');
      begin('wrap', 300, 20, 20);

    }, 200);
  });

  function begin(wrapId, itemWidth, hGap, vGap){
    var wrap = $('#'+wrapId),
      wrapWidth = wrap.width(),
      cacheDom = [],
      cacheTop = [0],
      //单元宽加边距
      iw = hGap + itemWidth,
      //一排能放多少个单元
      column = Math.floor((wrapWidth+hGap)/iw),
      //存放每一排的单元高度数组，用于下一排的排列
      heightArr = [],
      curLen = 0;
    var winHeight = $(window).height();
    var numGroup = column * 4;

      // 调整容器居中
      wrap.css({left: (wrapWidth - iw*column + hGap)/2 + 'px'});
      //初始化高度数组
      for(var i = 0;i < column; i++){
        heightArr.push(0);
      }

      // 第一组数据渲染
      testData.loadData(numGroup, function(tdata){
        loadImgs(tdata, function(data){
              appendData(data, true);
              flow(true, column);
          });
      });
        
        // 记录滚动值，用于区分是否向下滚动

        var stBefore = $(window).scrollTop();

      // 监听滚动事件
     $(window).bind('scroll.infinite',function(){
      scrollHandler && clearTimeout(scrollHandler);
      scrollHandler = setTimeout(function(){
        var scrollTop = $(window).scrollTop();
        //console.log(scrollTop, winHeight,getMinTop().height);
        var upIndex = beforeWho(scrollTop),
          downIndex = beforeWho(scrollTop + winHeight);

          groupBetter(upIndex, downIndex);
        if(scrollTop<stBefore){
          stBefore = scrollTop;
          return;
        }
        stBefore = scrollTop;
        //console.log(scrollTop);
        // 触发加载应该是，当接近最短列高度之前就触发加载
        if(scrollTop+winHeight>getMinTop().height - 150){
            //console.log('loading');
            testData.loadData(numGroup, function(edata){
                  extraItems(edata);
                });
        }
      },200);
     });

     function groupBetter(uIndex, dIndex){
      var groups = wrap.find('.group');
      
      $.each(groups,function(index, group){
        group = $(group);
        if(index==uIndex||index==uIndex-1||index==dIndex||index==dIndex+1){
          if(!group.hasClass('has-data')){
            group.html(cacheDom[index]).addClass('has-data');
          }
        }else{
          group.html('').removeClass('has-data');
        }
      });

     }

    // 获取最短一列的高度和列序号
    function getMinTop(){
        var res = heightArr[0],
            ri = 0;
        heightArr.slice(1).forEach(function(e, i){
            if(e<res){
                res = e;
                ri = i+1;
            }
        })
        return {
            height: res,
            index: ri
        };
    }

    // 继续加载数据
    function extraItems(data){
      if(!data.length){
        return;
      }
       // 对数据进行 加载图片 ， 加载完之后 dom字符串生成， 生成后添加到容器，添加完进行布局处理 
        loadImgs(data, function(data){
            appendData(data);
            flow(false);
        });
        
    }
    //返回指定高度所在的分组序号（0开始）
    function beforeWho(height){
      var i = 0,
        len = cacheTop.length;
      for(;i<len;i++){
        if(cacheTop[i]>height){
          break;
        }
      }
      return i-1;
    }

    //对容器内往后的内容做布局，分第一组数据和后续数据布局
    //第一组要做有个步骤，一个是针对首排，一个是剩下的布局（可以当做第二组）
    function flow(first,len){
        var group = wrap.find('.group');
        group = group.eq(group.length - 1);
        var lefts;
        var items = [].slice.call(group.find('.item'));
        if(first){
          first = items.slice(0, len);
          lefts = items.slice(len);
          domFlow(first, true);
          domFlow(lefts);
        }else{
          domFlow(items);
        }
        //缓存每一组起点高度（当前组结尾最短位置就是下一组的起点）
        var minTop = getMinTop();
        cacheTop.push(minTop.height);
        //缓存每一组dom
        cacheDom.push(group.html());
        //group.height(minTop.height);
        //console.log(cacheDom);
    }

    function domFlow(doms, first){
      doms.forEach(function(e, i){
            var cur;
            e = $(e);
            var height = e.outerHeight();
            if(first){
              e.css({
                  left: iw*i+ 'px',
                  top: 0
              });
            }else{
              cur = getMinTop();
              e.css({
                  left: iw*cur.index + 'px',
                  top: cur.height + vGap + 'px'
              });
            }
            e.show();
            cur?(heightArr[cur.index] = cur.height+vGap+height)
            : heightArr[i] = height;
        });
        //wrap.css({height: getMaxTop().height+200});
    }

    // 生成dom字符串，并添加到容器
    function appendData(data, first){//是否还有必要加id？
      var domStr;
        var domArr = data.map(function(e,i){
            var date = new Date();
            var itemId = 'item_'+i+'_'+date.getTime();
            return '<div class="item" id="'
                + itemId 
                +'"><img src="'+e.src+'" /><p>' + e.desc + '</p>'+'</div>';
        });
        
        domStr = '<div class="group has-data">'+domArr.join('')+'</div>';
        first? wrap.html(domStr):wrap.append(domStr);
    }

    //加载所有图片后触发回调
    function loadImgs(data, cbk){
        var i = 0;
        var len = data.length;
        (function loadImg(){
            var img = new Image();
            img.onload = img.onerror = function(){
                i++;
                if(i==len){//全部加载完毕了
                    cbk(data);
                }else{
                    loadImg();
                }
            };
            img.src = data[i].src; 
        })();
        
    }
  }
})();
{%endhighlight%}

[demo页面地址>>](http://shellphon.wang/demo-codes/pages/waterfall/index.html)

总结，没想到的是纠结了我那么久的一个实现，写完才两百行代码，当然这其中也要归功于jQuery的方便，虽然这样整体大致实现了要求，但其还是有一些限制或者我还没考虑到的问题，相比于花瓣网的实现，还没分析出个结论来，但想想这块也是蛮复杂的，如果是普通的列表滚动加载，其实还好做一些，也不用弄绝对定位，也有不少网站的滚动加载并非无线滚动，而是滚动到一定高度之后变成了分页，心想那样的做法感觉没这般复杂了。
