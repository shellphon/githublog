---
layout: post
title: chrome扩展程序分析-Holmes
category: Hellocode
keywords: chrome,extension
description: 对Chrome扩展程序-Holmes源码解读
---

前阵子在微博看到关于chrome书签搜索的扩展程序[Holmes](https://chrome.google.com/webstore/detail/holmes/gokficnebmomagijbakglkcmhdbchbhn)，于是使用了一下，确实还不错，尤其书签多很多的情况下，有个搜索功能 ，比定时做书签分类等等方便得多很多。看着扩展程序功能简单，感觉实现应该不难，于是我就试着查看一下扩展程序源码，也可以顺便进一步了解chrome扩展程序的实现方法和操作api。

本篇文章意在讲解Holmes的主要实现，对于chrome扩展程序怎么一步一步建立起来，就不做重复说明，网上搜索即可。

首先，既然要研究扩展程序源码，那么最直接的方式当然就是从chrome安装目录来寻址该扩展程序的所在目录了。

这点，其实网上有资料可以查看的，比如[这里>>](https://zhidao.baidu.com/question/229070019.html)

步骤1，在chrome地址栏输入:`chrome://version` 回车，将结果页中“个人资料路径”一栏对应的值复制（其实是一个目录路径）

步骤2，打开资源管理器，键入刚复制的路径，进入目录，打开`Extsions`目录，里面都是各种以字母组合的命名文件夹，对应的其实是各个扩展程序，命名其实是扩展程序的id

步骤3，在地址栏输入:`chrome://extensions`，进入扩展程序管理页，找到对应的扩展程序选项，有`ID`，对应的ID值就是对应的扩展程序文件夹名字。这似乎是个唯一值，holmes的ID是：`gokficnebmomagijbakglkcmhdbchbhn`

遵循上面三个步骤，我们就可以找到Holmes的扩展程序目录了 ，将其复制到方便查看的位置，就可以开始查看源码了。

### 理解配置

做过扩展程序的都知道，项目必须有一个配置文件`manifest.json`

这里列一下主要的配置字段，不全

{%highlight javascript%}
{
   "background": {
      "page": "watson.html"
   },
   "browser_action": {
      "default_icon": "images/icon_19.png",
      "default_popup": "holmes.html",
      "default_title": "Holmes"
   },
   "commands": {
      "_execute_browser_action": {
         "suggested_key": {
            "default": "Alt+Shift+H"
         }
      }
   },
   "description": "Chrome Bookmark Search Extension",
   "icons": {
      "128": "images/icon_128.png",
      "16": "images/icon_19.png",
      "48": "images/icon_48.png"
   },
   "manifest_version": 2,
   "minimum_chrome_version": "25",
   "name": "Holmes",
   "omnibox": {
      "keyword": "*"
   },
   "permissions": [ "bookmarks", "tabs", "chrome://favicon/" ],
   "update_url": "https://clients2.google.com/service/update2/crx",
   "version": "3.2.1"
}
{%endhighlight%}

可以看到，这里有个permissions字段，字面意义应该是跟权限相关，这里配置了bookmarks、tabs、和`chrome://favicon/`,这为后面要用到chrome的一些功能埋下了伏笔（这么说好么？= =）

另外`browse_action`字段定义了点击扩展程序图标的一些行为，`default_popup`规定了点击弹出框定位到`holmes.html`,也就是扩展程序的业务页面，即搜索框和搜索结果。

### 深入页面

找到holmes.html,查看页面会发现，页面主要引入的js文件：

~~~
jquery 库文件
fuse.min.js 模糊查询工具
jquery.Core.js 基于jquery的核心方法
keymaster.min.js 按键事件工具
jquery.holmes.js 基于jquery的页面业务逻辑
~~~

页面的主要dom结构：

{%highlight html%}
<div id="link-wrap" class="cf">
    <a class="icon-question" href="http://www.blackfish.fi/holmes/" target="_blank" title="Holmes website"></a>
</div>

<section>
    <header class="cf">
        <div id="search">
            <img src="images/icon_19.png">
            <input id="pattern" type="text" autofocus="autofocus" autocomplete="off" placeholder="Holmes at your service.">
        </div>
    </header>
</section>

<section>
    <div id="view">
        <ol></ol>
    </div>
</section>
{%endhighlight%}

主要的节点是：输入框 `#pattern` 和 搜索结果 `#view`.

到此，我们大概了解了holmes主要用到的是jquery来方便编程，利用keymaster来处理按键事件，利用fuse的模糊搜索来实现模糊查询书签。


那么，我们怎么获得chrome的书签呢？如果书签有增删改，又该怎么办呢？另外，我要怎么打开标签页来承载某个书签呢？

### 获取书签和标签页操作

获取书签，其实就呼应了前面说过的配置权限`permissions`.

我们怎么知道的？ 首先定位到`jquery.Core.js`文件，文件内容很简单，不过做了压缩，这里我优化了一下方便走读。

{%highlight javascript%}
(function() {
    var o, r;
    window.Holmes = {
        bookmarks: [],
        version: 3.21,
        showShortcutInfo: !1
    };
     r = function(o) {
        return function(o) {
            var e, t, n, a;
            for (a = [], t = 0, n = o.length; n > t; t++) {
                e = o[t];
                if(e.hasOwnProperty("children")){
                    a.push(r(e.children));
                }else{
                    if(e.url.match(/^javascript/)){
                        a.push(void 0);
                    }else{

                        (e.title || (e.title = e.url), a.push(Holmes.bookmarks.push({
                                title: e.title,
                                url: e.url
                            })));
                    } 
                } 
            }
            return a
        }
    }(this);
    o = function() {
        return chrome.bookmarks.getTree(function(o) {
            return Holmes.bookmarks = [], r(o)
        })
    };
     chrome.bookmarks.onCreated.addListener(function(r, e) {
        return o()
    });
     chrome.bookmarks.onRemoved.addListener(function(r, e) {
        return o()
    });
     chrome.bookmarks.onChanged.addListener(function(r, e) {
        return o()
    });
     Holmes.getPlaceholder = function() {
        var o;
        return o = ["Holmes at your service.", "How can I help you?", "It is a good day for searching.", "You know my methods. Apply them."], o[Math.floor(Math.random() * o.length)]
    };
    o()
}).call(this);
{%endhighlight%}

这里主要是定义了全局对象：`Holmes`，包含三个属性，其中最主要的是`bookmarks`，它是一个数组，存储chrome上的书签，怎么存的呢？

在上述代码上可以看出，通过调用`chrome.bookmarks.getTree`, `chrome.bookmarks`是chrome提供的书签对象api，用于各种书签操作，[chrome书签操作>>](https://developer.chrome.com/extensions/bookmarks), 这里getTree就是获取书签树结构，参数为回调函数，从回调函数参数可以获得树节点，通过children可以获得子节点，于是这里是实现对节点的处理 ，当有children节点时，递归操作，无则当做链接获取title跟url属性，并push到bookmarks数组去（有可能收藏的是脚本代码，这块这里做了过滤处理）。

要用`chrome.bookmarks`，从官方文档可知道， 需要配置permissions权限

~~~
{
    "name": "My extension",
    ...
    "permissions": [
      "bookmarks"
    ],
    ...
}
~~~

另外，bookmarks对象还有事件处理函数，这里用于更新书签数据以备检索。

~~~
    chrome.bookmarks.onCreated.addListener
    chrome.bookmarks.onChangeed.addListener
    chrome.bookmarks.onRemoved.addListener
~~~

这里还没涉及到tabs，但因为都要配置`permissions`，所以提前说明，同样，tabs也有[官网文档说明](https://developer.chrome.com/extensions/tabs)

其配置权限类似bookmarks，关于tabs的使用相当简单：

{%highlight javascript%}
chrome.tabs.create({url:xxx, pinned:true}) // 打开标签页，url为链接， pinned是否固定标签页
{%endhighlight%}

标签页这里主要是打开标签页，那就只需要用到这条api，其他可以到上面文档说明去查看。

### 业务逻辑

业务逻辑在holmes.js内，主要涉及的是按键事件交互处理以及检索结果展示。

对于检索结果，其实是从全局对象`Holmes.bookmarks`入手， 对其采用fuse模糊搜索。

fuse的具体操作可以看 [fuse官网](http://fusejs.io/)

使用很简单，如下：

{%highlight javascript%}
// 配置对象，检索关键属性
var option = {
    keys:['id']
};
// data为测试数据
f = new Fuse(data, options);

f.search('查找内容'); //这里将对data的id属性做 查找内容 的搜索

{%endhighlight%}

在holmes里，使用很简单：在输入框监听keyup，清空结果dom(`$view`), 对书签数据进行模糊查询（键值：书签标题），得到结果调用updateView方法来给`$view`更新内容。（涉及到键入监听，其实还可以考虑做节流操作避免重复执行搜索）

代码如下：

{%highlight javascript%}
// 监听输入框keyup事件
$('#pattern').on('keyup', function(e) {
    var _kc, _ret, f, options;
    _kc = e.keyCode;
    if (_kc === 38 || _kc === 40 || _kc === 37 || _kc === 39) {
      $(this).css('-webkit-user-select', 'text');
      return false;
    }
    pattern = $('#pattern').val();
    // 清空搜索结果
    $view.html('');
    _ret = [];
    if (pattern.length > 0) {
      pattern.replace(' ', '');
      options = {
        keys: ['title']
      };
      // 对title进行查询
      f = new Fuse(Holmes.bookmarks, options);
      _ret = f.search(pattern);
    } else {
      _ret = [];
      search = null;
    }
    // 调用updateView对搜索结果进行展示
    return updateView(_ret);
  });
{%endhighlight%}

关于`updateView`: 已经设定了`bmarks_per_page`变量用来定义结果显示数量(并非把全部书签结果都输出，而是输出前十条数据)，并且对标题进行省略裁剪，并针对关键字插入`span`标签（可做样式高亮，但扩展程序并没有做），在拼接dom模板时对首条数据加入current类，并且将对应的dom保存到`$current_mark`,用于回车时直接打开以及显示选中项，对拼接的dom添加到`$view`中，并且定义a标签点击事件（由于每次搜索结果都是重新添加内容，所以这里不会涉及重复绑定，但其实可以给`$view`做事件代理更佳）

代码如下：

{%highlight javascript%}
  matchString = function(_string, _char_count) {
    var _inp_val_pat;
    _string = _string.length < _char_count ? _string : _string.substr(0, _char_count) + '...';
    _inp_val_pat = new RegExp(pattern, "gi");
    return _string.replace(_inp_val_pat, '<span>' + _inp_val_pat.exec(_string) + '</span>');
  };

  updateView = function(bmarks) {
    var _classes, _match, _update, i, j, len, mark;
    if (bmarks.length > 0) {
      _update = '';
      for (i = j = 0, len = bmarks.length; j < len; i = ++j) {
        mark = bmarks[i];
        // 我认为这里直接break跳出循环即可，无需continue继续循环
        if (!(i < bmarks_per_page)) {
          continue;
        }
        _classes = i === 0 ? 'current' : '';
        _match = matchString(mark.title, 50);
        _update += "<li class=\"" + _classes + " cf\"><img src=\"chrome://favicon/" + mark.url + "\"><a href=\"" + mark.url + "\" title=\"" + mark.url + "\">" + _match + "</a></li>";
      }
      $view.html(_update);
      $current_mark = $view.children(':first');
      return $view.find('a').on('click', function() {
        return chrome.tabs.create({
          url: this.href
        });
      });
    } else {
      if (search != null) {
        $view.html('<div class="no-bookmarks-found"><h1>Oh no!</h1><p><b>No single bookmark found.</b><br>Press enter to Google!</p><p>Or you could check out<br><a href="http://www.blackfish.fi/holmes/" target="_blank" title="Holmes website">Holmes new website!</a></p></div>');
      }
      return $current_mark = null;
    }
  };
{%endhighlight%}

ps：这里有个小知识点，其实也涉及到`permissions`配置，在chrome下，`chrome://favicon/`+页面地址 可以获得该网站的favicon.

其他按键交互：除了输入框键入字符的监听外，还监听了回车打开标签页和切换结果选中项，主要用了keymaster

其api可以参考这里：[keymaster官网](https://github.com/madrobby/keymaster)

主要的代码逻辑：

{%highlight javascript%}
 key.filter = function(event) {
    var tagName;
    tagName = (event.target || event.srcElement).tagName;
    return !(tagName === 'SELECT' || tagName === 'TEXTAREA');
  };

  key('down, up', function(e, h) {
    if (($current_mark != null) && $view.children().length > 1) {
      switch (h.shortcut) {
        case 'down':
          if ($current_mark.index() !== bmarks_per_page - 1 && $current_mark.index() < $view.children().length - 1) {
            return $current_mark = $current_mark.removeClass('current')
            .next('li')
            .addClass('current');
          }
          break;
        case 'up':
          if ($current_mark.index() !== 0) {
            return $current_mark = $current_mark.removeClass('current')
            .prev('li')
            .addClass('current');
          }
      }
    }
  });

  key('enter, shift + enter', function(e, h) {
    switch (h.shortcut) {
      case 'enter':
      case 'shift+enter':
        if ($current_mark != null) {
          return chrome.tabs.create({
            url: $current_mark.find('a').prop('href'),
            pinned: key.shift ? true : false
          });
        } else {
          if (pattern.length > 2) {
            return chrome.tabs.create({
              url: 'http://www.google.com/search?q=' + pattern
            });
          }
        }
    }
  });
{%endhighlight%}


至此，holmes的主要逻辑也就解读完毕了， 对于样式那块，本文不做解读，可看出，其实该扩展程序，还有很多优化空间，感兴趣，其实可以自己改改，来优化使用体验，比如：代码的一些重复逻辑、加入事件代理、搜索结果显示体验等等。（目前，该扩展程序在说明上貌似最新一版已经是2015年的事了，看来作者也没有继续更新的打算了）