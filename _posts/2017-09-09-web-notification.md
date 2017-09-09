---
layout: post
title: 如何做web通知提醒
category: Tool
keywords: webNotification
description: 如何使用notification通知
---

上回在sf技术圈反馈处看到有用户建议将消息做成桌面通知，这样能方便用户及时查看消息提醒，虽然我不赞成这个做法，不过遇到过几次桌面通知实例，想想应该也不难，不如试着学一下。

### 一般的通知

这一般的通知，最简单的，就是直接在页面某块内容上加上提示图标（比如纠结的小红点），这种纯粹就是在html的dom上加点样式就能实现了，缺点是，你必须一直在逛这个页面，这个提示位置也比如一直存在，比如上导航条。

### title通知

不大记得几年前哪款社交网站好像也做了这种title的通知，利用的是标签页上显示的页面title信息，不断的变更title，以达到一个提醒的作用，这个提醒信息最好有一定的辨析度，比如“【您有一条新的消息】”，为了达到闪动效果，通过配合跟空白字符串一直交替替换title，实现大致如下：

{%highlight javascript%}
(function(){
      var actived = true;
      var intervaler = null;
      var originTitle = document.title;
      
      window.onfocus = function(){
        actived = true;
        clearInterval(intervaler);
        document.title = originTitle;
        intervaler = null;
      };
      window.onblur = function(){
        actived = false;
        setTimeout(function(){
          showTips('您有新的消息');
        },3000);
      };
      function showTips(tip){
        if(!actived){
          tip = '【'+tip+'】';
          intervaler = setInterval(function(){
            if(document.title === tip){
              document.title = '【      】';
            }else{
              document.title = tip;
            }
          },300);
        }
      }
    })();
    /*
      // IE要用这个
      document.onfocusin = function(){};
      document.onfocusout = function(){};
    */
{%endhighlight%}

主要逻辑是用一个变量标识页面是否聚焦，监听页面聚焦和失焦，失焦时设置定时器变更title，聚焦时清理定时器并还原title。

[示例>>](http://shellphon.wang/demo-codes/pages/notification/title.html)

不过它的缺点也比较明显，这个视觉上依赖于你的浏览器没有最小化，其次，title的闪动速度不可控，在我的mac chrome下，第一个延时很慢，闪动的频率也很慢，当然如果你仅仅只是在当前页上的地址栏聚焦，也属于页面的失焦，此时的闪动效率就比较符合代码预期。

### 桌面通知 Web Notifications

上述的通知都具有一定局限性，如果我们想像qq那种弹框，那么就需要用到这么一个桌面通知。 `Notification`是window上的一个成员。这里就不谈兼容性了。

首先是`Notification`作为一个对象，它有一个方法`requestPermission`,这是询问用户是否接受通知，桌面通知需要设置权限，不然多多少少有一种骚扰的感觉，这也是为啥我不大赞成用桌面通知做东西，当然你可以利用这个来获取用户授权，如果用户拒绝，你就不需要考虑通知了。

我们说一下这个方法在新语法上的使用（基于Promise）

{%highlight javascript%}
Notification.requestPermission().then(function(status){});
{%endhighlight%}

这里的status有三种取值：default, denied, granted;

顾名思义，一个默认值 ，一个拒绝通知，一个授权通知。

所以我们只要判断一下，是否为granted，是则开始做我们的通知逻辑。

除了在回调里获得status来做判断，还可以考虑用`Notification.permission`,这个是Notification用于获得用户授权情况的属性，取值情况跟前面说的一样。

拿到通知权限之后 ，就可以准备做桌面通知了。

此时，`Notification`作为构造函数，通过new实例化一个桌面通知，参数`title`、`options`，前者必选，表示弹框的标题，后者可选是一个配置对象，可配置信息比较多，可以参考这里：[MDN关于notification的文档](https://developer.mozilla.org/zh-CN/docs/Web/API/notification/Notification) 

这里我们只考虑配置`body`，表示通知内容。

如此一来，我们就可以写一个完整的示例了。

{%highlight html%}
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Notification</title>
</head>
<body>
  <input type="text" class="word">
  <button class="biu">biu~</button>
  <script>
    (function(){
      var noti = window.Notification;
      var $word = document.querySelector('.word'),
        $biu = document.querySelector('.biu');

        $biu.onclick = function(){
          var word = $word.value;
          if(noti.permission!='granted'){
            noti.requestPermission().then(function(){
              if(noti.permission=='granted'){
                setTimeout(function(){
                  toNotice(word);
                },4000);
              }else{
                alert('请同意接收通知~');
              }
            });
          }else{
            setTimeout(function(){
              toNotice(word);
            },4000);
          }
        };

      function toNotice(word){
        var obj = null;
        
        obj = new noti('有人回复', {
          body:'你刚才说的是"'+word+'"?'
        });
        
        obj.onclick = function(){
          console.log('click');
          window.focus();
        };
      }
    })();
  </script>
</body>
</html>
{%endhighlight%}

如上述代码描述，先判断是否授权，未授权则先询问授权，已授权，则直接准备发送通知，未授权则可以询问授权，但是如果已禁止的话，那就只能等用户自行去浏览器设置网站的通知权限了，这个是浏览器层面的设置，代码上无从变动，所以这个授权询问，也是比较尴尬，当然可以在页面做一些提示来引导用户删除已有的通知权限设置，使得页面能重新寻求通知权限。

另外，new构造出来的实例，我们可以在其身上绑定事件，比如点击事件，在代码示例中，通过绑定click事件之后，`window.focus();`可以让相应页面聚焦。其他事件，可以参考文档。

注意： 在实践中，本地启动web服务可以正常使用web notification,但如果部署到线上机器时，可能会无效，chrome提示需要https协议。


尽管通知实现起来看似简单，但其实我觉得更多的要考虑用户体验的问题 ，随着“强迫症”等关键词在网络流传，我们不得不正视一下做通知这样的需求的可行性，既要做到不骚扰用户，又要考虑满足用户的需求。比如我自己的话，基本上手机除了微信，其他app都没有通知的权限，大多数时候，我被通知干扰的情况远远大于通知即时满足我的需求，所以我觉得通知这样的功能，在实际应用中，应该作为一个用户主动需求来实现，比如一个授权按钮，说明通知的好处，点击通知则索要权限，如果已经禁止则引导用户自行删除原先的权限设置，再做通知权限咨询，这样，更好的满足大多数人的需求。

参考资料：

[简单了解HTML5中的Web Notification桌面通知](http://www.zhangxinxu.com/wordpress/2016/07/know-html5-web-notification/)

[MDN文档](https://developer.mozilla.org/zh-CN/docs/Web/API/notification/Notification)

