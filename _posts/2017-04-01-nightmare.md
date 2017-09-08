---
layout: post
title: nightmare自动化实践
category: Tool
keywords: nightmare
description: nightmare自动化实践
---

以前偶尔听到`自动化测试`这个概念，但一直对其一头雾水，前端界面主要也就是`UI`，怎么才能做到自动化呢？还是在跟前同事交流过程中，他提到了`nightmare`工具。于是就去看了一下，感觉是一款神器，其主要通过编写脚本，运行node来模拟浏览器访问和交互，底层基于`electron`。可以做到同时打开`electron`窗口，方便调试跟踪，其api用法比`phantomjs`更为简单好用！

### 安装注意

> npm install nightmare

`nightmare`依赖`electron`，貌似需要用到`python`，比如window系统可能没装python的话，在安装`nightmare`时会报错说找不到`python`的环境变量，建议装个`python2.7`先。

### 基本用法

如下代码：

{%highlight javascript%}
var Nightmare = require('nightmare');       
var nightmare = Nightmare({ show: true });//显示electron窗口

nightmare
//加载页面
.goto('http://127.0.0.1:10087')
//等待选择器加载完毕，可以用数值（表示等待时间，单位毫秒）
.wait('body')
//浏览器内页面执行
.evaluate(function(){
  var p = document.querySelector('#dont').innerText;
  return p;
})
//结束操作
.end()
//前面都是操作队列，需要有then方法才会触发执行上述队列的操作
.then(function(res){//函数参数为evaluate的返回值
  console.log(res);
})
//处理异常情况
.catch(function (error) {
  console.error('login failed:', error);
});

{%endhighlight%}

还有一些常用的`api`,如`type`输入操作，`click`点击操作等等。具体可以[参考>>](https://github.com/segmentio/nightmare#api)

### 要注意的地方

`evaluate`方法，方法的参数函数的执行环境是浏览器环境，而不是脚本的运行环境，因此，其内部无法访问到脚本内定义的全局变量,但是可以通过`evaluate`的后续参数，来作为第一参数函数的参数传入。

比如

{%highlight javascript%}
var Nightmare = require('nightmare');       
var nightmare = Nightmare({ show: true });//显示electron窗口

var hello = 'world';

nightmare
//加载页面
.goto('http://127.0.0.1:10087')
//等待选择器加载完毕，可以用数值（表示等待时间，单位毫秒）
.wait('body')
//浏览器内页面执行
.evaluate(function(content){
  //这里外部的变量hello以参数的形式传了进来，可以用content获得。
  var p = document.querySelector('#dont').innerText;
  return p;
}, hello)
//结束操作
.end()
//前面都是操作队列，需要有then方法才会触发执行上述队列的操作
.then(function(res){//函数参数为evaluate的返回值
  console.log(res);
})
//处理异常情况
.catch(function (error) {
  console.error('login failed:', error);
});

{%endhighlight%}

虽说如此，但是！！！这种方法不能传一些特殊对象，比如原型链上的内容，是不会带上的，而且即使说node环境有Date对象，浏览器也有Date对象，也不能直接传入一个Date的实例，传入之后，也用不了Date的内置方法。


`then`的重要性：最上面的示例代码里注释也有提到，需要加入then才能保证队列的执行.

引用[这里的一句话](https://github.com/fyuanfen/nightmare)

> 这是因为每一个 nightmare 实例都有一个操作队列，而这个操作队列保存着 nightmare 的一系列操作。而 nightmare 的每一个链式调用只是将操作保存到队列里面，并没有立刻执行操作。

关于这个队列操作，可以读一下nightmare源码，nightmare的实例对象中都有一个`_queue`的数组，用来保存每一个基本api动作，等到调用`then`时，才去触发`run`函数，从而去处理`_queue`里的一个个动作。

### 实践例子

我在sf里，时不时就去审核中心处，做一下一些挖坟问题审核，时间久了，各种挖坟回答就多起来了， 作为强迫症的我，发现点来点去都是些重复操作，大部分可以拒绝通过的回答，无非就是问解决了没有、顶等等无意义的回答。(这种跟帖式的回答真是令人反感，一个好端端的问答模式，你偏偏当做论坛来用。)

于是我考虑，写个脚本来自动化审核，过滤掉这些跟帖式回答处理（直接拒绝通过，需要投三票才真正拒绝，所以也不是说我说拒绝就一定拒绝。）

nightmare提供了一个良好的使用环境，可以模拟人为操作，很是方便，不用像写爬虫那样去模拟登录，而是写代码来替代那些人为操作，由于这种需要使用nightmare做一些循环跳转，于是我便定下了一个逻辑代码基本套路，如下

{%highlight javascript%}
var Nightmare = require('nightmare');       
var nightmare = Nightmare({ show: true });//显示electron窗口

//多数网站要做登录后才能操作
function login(){
    nightmare.goto()
    .wait('body')
    .click()
    .type()
    .click()
    .wait()
    .then(function(res){
        //登录完就该去做页面跳转实际逻辑了
        jump();
    })
    .catch(function(e){
        console.error();
    })
}
//页面跳转
function jump(){
    nightmare
    //有些页面要循环好几次才能获得新的数据
    .wait()//所以要等待一些时间
    .goto()
    .wait('body')
    .click()
    .evaluate(function(){
        return res;
    })
    .then(function(res){
        //做一下跳出循环的判断
        if(end){
            end();
            return;
        }
        jump();
    })
    .catch(function(e){
        console.error();
    })
}
//关闭electron
function end(){
    nightmare.end().then(function(res){
        console.log('nightmare end!');
        //可以做一些日志静态化记录
      });
}

{%endhighlight%}

就顺着这个基本套路，也就差不多能做点东西了，再通过事先分析页面，主要操作是在evaluate内做判断和数据处理，通过then收集数据，并在end最后做日志记录。

我的审核脚本大致是这样的：

{%highlight javascript%}
var Nightmare = require('nightmare');       
var nightmare = Nightmare({ show: true,waitTimeout: 800000  });//显示electron窗口

var fs = require('fs');

var jumpTimes = 0;
var lastOne = null;
var markLog = [];
/*
 1. 先登录 
 2. 获取页面需跳转数
 3. 开始审核
  3.1 判断回答，并拒绝或者保持中立
  3.2 然后循环到步骤3，直到跳转数自减至0，结束
*/
function login() {
  nightmare
    .goto('首页url')
    .wait('.SFLogin')
    .click('.SFLogin')
    .type('input[name="username"]','')//键入用户名
    .type('input[name="password"]','')//密码
    .click('')//点击登录按钮
    .wait('.widget__subnav')
    .then(function(res){
      console.log('finish login');
      getTimes();
    }).catch(function (error) {
      console.error('login failed:', error);
    });
}

function end(message){
  console.log('ending:'+message);
  nightmare.end().then(function(res){
    console.log('nightmare end!');
    staticLog();
  });
}

//先去审核页取出需要审核的回答个数
function getTimes(){
  nightmare
    .goto('审核页面')
    .wait('body')
    .evaluate(function () {
      var number = document.querySelectorAll('.audit__number')[1];
      number = +number.innerText;
      return number;
    }).then(function(res){
      if(res==0){
        end('审核数：0');
        return;
      }
      jumpTimes = res;
      console.log('need to review times:', jumpTimes);
      jumpDigTomb();
    }).catch(function (error) {
      console.error('getTimes failed:', error);
    });
}
//去到挖坟帖审核页面
function jumpDigTomb(){
  nightmare
  .wait(4000)
  .goto('挖坟页')
  .wait('回答的选择器')
  .evaluate(function (last) {
    try{
      var pNum = document.querySelectorAll('xxx');
      var p = '';
      var link = document.querySelector('xxx').href;
      //用一个对象来存储主要内容
      var resObj = {
        link:link
      };
      //去重，这里去重是因为每次都是访问同一个页面，
      //页面的数据总是会有重复，于是简单做一些上一条数据的存储，来做去重操作
      if(last && link==last.link){
        resObj.message = 'repeat';
        return resObj;
      }
      if(pNum&&pNum.length!=0){
        p = pNum[0].innerText;
        if(sth/*判断逻辑*/){
          document.querySelector('.audit__reasons-item[data-reason^="不符合"]').click();
         //按钮点击
          document.querySelector('.js__audit-btn--reject').click();
             resObj.shortAnswer=p;
             resObj.message='comment reject';
          return resObj;
        }
        if(sth/*判断逻辑*/){
          document.querySelector('.audit__reasons-item[data-reason^="无意义"]').click();
         
          document.querySelector('.js__audit-btn--reject').click();
             resObj.shortAnswer=p;
             resObj.message='nomean reject';
           return resObj;
        }
      }else{
        p = "no p mark";
      }
    }catch(exception){
      //其他意想不到的，暂时忽略。
      resObj.shortAnswer = 'need human review';
      resObj.message = 'need human review';
      return resObj;
    }
    document.querySelector('.js__audit-btn--ignore').click();
    
      resObj.shortAnswer = p;
      resObj.message='ignore';
    
    return resObj;

  }, lastOne)
  .then(function (result) {
    if(result.message=='repeat'){
      console.log('repeat review:', result.link);
      jumpDigTomb();
      return;
    }
    //保存上一次的数据，避免重复
    lastOne = result;
    markLog.push(lastOne);
    console.log('No.',jumpTimes--,result.message,':',result.link,'\n',result.shortAnswer);
    if(jumpTimes<=0){
      end('审核完毕');
      return;
    }
    jumpDigTomb();
  })
  .catch(function (error) {
    console.error('reivew failed:', error);
    jumpDigTomb();
  });
}
function genDateStr(){
  var date = new Date(),
           res = [];
  res.push(date.getFullYear());
  res.push(date.getMonth()>8?date.getMonth()+1:('0'+date.getMonth()));
  res.push(date.getDate()>9?date.getDate():('0'+date.getDate()));
  res.push(date.getHours()>9?date.getHours():('0'+date.getHours()))
  res.push(date.getMinutes()>9?date.getMinutes():('0'+date.getMinutes()))
  return res.join('');
 }
 //记录日志生成文件，格式上只做了简单回车优化
function staticLog(){
  fs.writeFileSync(__dirname+'/sflog'+genDateStr()+'.txt',
    JSON.stringify(markLog)
    .replace(/\{|(\})/g,function(all, end){
      if(end){
        return '\n-------'
      }
      return '\n'
    })
  );
  console.log('log end');
}

login();
{%endhighlight%}

一下子，需要审核两百条挖坟信息，脚本就帮我做了，省下时间去干别的事儿了。

期间，要留意的问题是分析页面dom要到位，确保wait选择器的时候，这选择器是必然存在的，不然，结局就会是脚本一直在等待，直到最后跳出，中断了后续运行。

综上，上述只适用于简单用户名和密码登录的网站，如果是需要验证码的那种，可能就没那么好做了，但可以考虑打开`electron`窗口，做半自动化模式。可以[参考这里](http://gewenmao.github.io/2016/web/nightmare-with-command-line-prompt)

--update:

最近简要的翻了一下nightmare的源码跟api文档，发现`evaluate`还有另外一种用法：

{%highlight javascript%}
nm.evaluate(fn,arg)
.then(function(data){});
{%endhighlight%}

前面提到的`evaluate`，这里then里的function获取到的data，其实就是fn的返回内容。但如果fn的参数设定大于arg（即evaluate总参数个数-1）时，fn的最后一个多余的参数为done，其实是nightmare给添加进去的，这个时候`evalute`的结束返回机制就变了，此时直接`return`不会执行后续的`end()`来关闭窗口，而是一直等待evaluate的timeout，归根于此时的fn内部需要显示调用`done(err,data)`来结束`evaluate`.

举了简单代码例子：

{%highlight javascript%}
nm.evaluate(function(word, done){
        setTimeout(done(null, 'hello'),500);
        //return word + $('.click-word').text();
      }, '嘿嘿')
      .end()
      .then(function(data){});
{%endhighlight%}

这里then的function最终获取到的是`hello`, 这种写法可用于在浏览器端做异步调用结束运行。

### 参考

[使用 nightmare 进行页面测试介绍](http://gewenmao.github.io/2016/web/how-to-use-nightmare-for-web-page-test)  
[nightmare官网](https://github.com/segmentio/nightmare)  
[http://gewenmao.github.io/2016/web/nightmare-with-command-line-prompt](http://gewenmao.github.io/2016/web/nightmare-with-command-line-prompt)