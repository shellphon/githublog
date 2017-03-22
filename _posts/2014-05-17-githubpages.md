---
layout: post
title: 建立自己的github page
category: Hellocode
---

&emsp;&emsp;鉴于与朋友提到用github展示网页，而无需自己去租服务器。    
&emsp;&emsp;这里就简单介绍一下如何，配置出自己的github page；其实自己也是网上google的，所以也不细讲，简单描述一下步骤，并记录一下，当初操作的时候自己产生的一些疑问。

***

实际上`Page`是github提供的一个网页展示功能，我一开始是直接去github上查看[pages](https://pages.github.com/)的介绍的.     

1. 首先你要建立一个repository，repository的命名是username.github.io (username是你的github账号)，我在这个步骤的时候以为username可以随便设置，结果纠结了一个晚上，怎么没效果。实际上page有两种模式，后面再提。    
2. 建立玩repository，那就可以开始往里面放html文件等等了。步骤1中说的username.github.io就会是到时候github提供给你的域名了，自己有域名可以自己写配置，这个我也没看。    
3. page介绍里面后续步骤，实际是本地装git，然后推送代码上github，有朋友略过了这部，貌似github上是需要本地git来init的，否则在github上对应的repo没法创建文件。ps:既然选择了github，不会git还玩啥呢，最起码按步骤学下git基本命令。    
4. 设置index.html文件，那么等差不多十分多钟之后，就可以用repo的域名来访问了。

###pages描述
- 实际上，pages除了上述模式外，还有另一种，那是用来为每个repo设置一个介绍页面而整的自动化分支，在github上管理自己的repo页面上，setting页面设置有自动page的功能，按照步骤操作，即可生成repo的一个分支gh-pages，这个分支很特殊，代码上只是提供了一个介绍这个页面的一些配置和下载repo主分支代码的功能，然后通过username.github.io/repo_name 访问这个页面，我是先接触了这个，再接触前面说的page模式，搞得我那时候纠结很久。    
&emsp;&emsp;一般人在github建的博客，是用的第一种，而我反而用第二种方式，噗。   
用gh-pages分支搭建博客的时候，平时提交点内容或者更新时，用的是这样的命令：
    
> git pull origin gh-pages  
git push origin gh-pages

