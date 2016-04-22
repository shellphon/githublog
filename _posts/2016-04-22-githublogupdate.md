---
layout: post
title:  博客更新
category: Journal
---

 2016年第一篇小博文，刚`push`上去，就收到`github`的邮件，说是下个月初开始`github page`就开始升级到`jekyll3`了，说我的`_config.xml`配置得改了。

 然后一看，换了`markdown`解析器，改完，在还没发现有一些格式不对的情况下，发现高亮解析也换了，`pygments`换成`rouge`.

 简单改一下配置环境之后，也是折腾，于是就本地下一个jekyll3环境，结果一运行又说找不到`keyword: categories`的情况。

 后来网上搜一下才知道，原来升级一下ruby版本到2.3.+就可以了。

 然后改呀改。

 列一下主要的一些改动：

~~~
### 这种符号后面要加空格，不然不会把后续的文字加粗，特别是多行字的时候。
``` 这种代码格式 改成 ~~~ 不然，会当成单个`来解析，而且最好前面空一行，不然可能被前面的内容给影响到

gist 不能直接用了，要在配置里写上
gems:
  - jekyll-gist

~~~

 还有一些样式细节就不说了，没细究，毕竟当初自己弄的样式不专业= =||

`_config.xml`:

~~~
baseurl: /githublog
encoding: utf-8
permalink: /:year/:month/:title.html
markdown: kramdown
highlighter: rouge
gems:
  - jekyll-gist
~~~