---
layout: post
title: 一个分页器的逻辑
category: Hellocode
keywords: pagination
description: 分页生成页码的主要逻辑
---

六月的博文还没挤出来一篇，真是尴尬，之前再想瀑布流的实现和优化，但是卡在中间，就没咋去弄，先整理一下一直没整理的分页生成逻辑吧。

### 分页的主要使用背景

列表数据展示，当数据量比较大的时候，分页可以减轻后端查找以及接口返回数据大小，而且能减少多余的数据查询，前端则优化展示体验，过多数据会让页面显得复杂冗长，分页可以有效地管理数据展示，方便用户针对性查看数据。

顺带提一下，瀑布流转分页也是一大优化调整，新浪微博个人主页在下拉加载微博数据到一定量时，就会变为分页的形式。

### 分页的使用

分页的使用场景说来，其实有两种模式：

1. 后端掌控分页，接口只返回数据总数和一页的数据量，通过接口参数才决定哪一页的数据，这种情况下，前端的分页页码可以是通过后端生成模板，也可以是前端直接根据页数和当前页来选择展示，点击不同页面带上不同页数参数去调用接口获取数据。

2. 后端接口一次性返回所有数据，由前端来管理这些数据，自动分页，通过页码切换来显示不同页内容。

### 前端页码生成逻辑

综上，无论是后端返回全部数据还是部分数据，页码部分都要代码实现生成的，这里以前端的角度来实现页码生成（这样的话，一般分页内容主要是异步处理展示）

摘自使用项目的代码：基于jQuery，其实是抄自其它项目的分页，拿过来自己封了一下，比较糙

{%highlight javascript%}
//初始化分页：传入总页数\ 分页容器选择器 \以及翻页触发函数(参数为页码)
function pageInit(pageSize, pageBoxSelector, cbk){
    // 但页数不多于一页，没有生成页码的必要
    if(pageSize<=1){
        return;
    }
    var curPage = 1,//当前页码
        contentDom = $(pageBoxSelector),//页码容器
        // 页码模板
        tpl = '<span class="hint">使用“←”“→”快捷翻页</span>\
        \{pages}&nbsp;到<input type="text" class="pagetxt"  bindcursor="true" />页&nbsp;\
        \<input type="submit" value="确定" maxlength="6" class="pagebtn" />';
    
    //生成页码 total 页数， page 当前页
    function makePage (total, page) {
    
        // 存放页码排列的数组
        var pages = [];

        //单页码生成
        function createPage(index){
            // 当前页不带a标签
            if(page==index){
                pages.push('<strong>' + page + '</strong>');
            }else{
                pages.push('<a class="page-link" href="javascript:void(0);">' + index + '</a>');
            }
        }
        
        // 页数不超过10时，直接生成每一个页面
        if(total<=10){
            for(var i=1;i<=total;i++){
                createPage(i);
            }
        }else{
           //页数大于10且当前页远离总页数相对靠近首页(当前页小于5)
            if(page <= 5) {
                // 创建前五页码
                 for(var i = 1; i <=5; i++) {
                    createPage(i);
                 }
                // 剩下的 省略号+尾页
                pages.push(' … <a class="page-link" href="javascript:void(0);">' + total + '</a>');
                
            //总页数大于10且当前页接近总页数(在倒数四页内)
            }else if(page>=total-3){
                // 首页+省略号页码
                pages.push('<a class="page-link" href="javascript:void(0);">' + 1 + '</a> …');
                // 输出后五页页码
                for(var i=total-4;i<=total;i++){
                    createPage(i);
                }
            }else{ //除开上面两个情况即当前页在页码中间部分
                // 首页+……
                pages.push('<a class="page-link" href="javascript:void(0);">' + 1 + '</a> … ');
                // 输出当前页包括前后两页的页码总共五页
                for(var i=page-2;i<=page+2;i++){
                     createPage(i);
                }
                // 输出 ……+尾页
                pages.push(' … <a class="page-link" href="javascript:void(0);">' + total + '</a>');
            }
        }

        if (page > 1 && total > 1) {// 上一页
            pages.unshift('<a class="js-page-change page-prev" href="javascript:void(0);">上页</a>');
        } else {
            pages.unshift('<span>上页</span>');
        }
        if (page < total && total > 1) {// 下一页
            pages.push('<a class="js-page-change page-next" href="javascript:void(0);">下页</a>');
        } else {
            pages.push('<span>下页</span>');
        }
        contentDom.html(tpl.replace("{pages}", pages.join(" ")));
    }
    
    //分页切换
    function getPage (page) {
        if(page>pageSize){
            page = pageSize;
        }
        curPage = parseInt(page);
        makePage(pageSize, curPage); 
        if(cbk){//分页切换回调
            cbk(page);
        }          
    }

    //绑定事件
    $('.post-pages').delegate('.page-link','click',function(){//点击页码
        getPage($(this).text());
    }).delegate('.js-page-change','click',function(){//点击上下页
        var thisDom = $(this);
        if(thisDom.hasClass('page-next')){
            getPage(curPage+1);
        }
        if(thisDom.hasClass('page-prev')){
            getPage(curPage-1);
        }
    }).delegate('.pagebtn','click',function(){//直接跳转页
        var thisDom = $(this);
         var v = thisDom.siblings('.pagetxt').val();
        var objExp = /(^-?\d\d*$)/;
        if (objExp.test(v)) {
            getPage(v-0);
        } else {
            alert("页码必须是数字！");
            return;
        }
    });
    $(document).keydown(function (e) {//方向键翻页
        var target = $(e.target);
        var tag = target.prop('tagName');
        // 文本框中的左右键不做监听
        if(tag === "INPUT" ||tag === "TEXTAREA"){
            return;
        }
        var which = e.which;
        if (which === 37) {
            if($('.js-page-change.page-prev').length){
                getPage(curPage-1);
            }
        }
        if (which === 39) {
           if($('.js-page-change.page-next').length){
                getPage(curPage+1);
            }
        }
    });
    //初始化第一页生成
    makePage(pageSize, curPage);
}
{%endhighlight%}

这段代码读起来有点复杂，主要是function内又是function的，不过其实主要核心思想也明了，那就是页码的输出逻辑。

如果只是10页内的页码，直接从第一页输出到第十页，篇幅不会太大，但如果是超过10页的情况下，每个页码都输出就有点尴尬了。这个时候就要区分好。

当页数超过10页时，优先显示当前页前后的页码，其他页码能省的省，不过首尾页码保留。

所以就有三种情况：

1. 如果当前页比较靠近首页，比如前五页，那么直接输出 `1,2,3,4,5,……,n`
2. 如果当前页比较靠近尾页，比如倒数五页内，那么直接输出 `1,……,n-4,n-3,n-2,n-1,n`
3. 剩下的，假设当前页为x，则输出首尾页，和当前页码前后两页：`1,……,x-2,x-1,x,x+1,x+2,……,n`

这里限定了页码范围值为10，显示页码为5，是比较合理的范围了。

还没分析过其它分页器的算法，不过单10页限定，我觉得也够用了~
