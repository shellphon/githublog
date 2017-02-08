---
layout: post
title: linux本地jekyll折腾记
category: Hellocode
---

#### 端午三天小长假，麻麻回家，今天就宅在家继续折腾  
[sf](http://sf.gg)的小伙伴说，elementary os很好看，我就去试用了一下，确实不错，也够折腾的。现在是折腾纪实，最后再来个os见面印象。
  
#### 问题1：输入法不能用。  
我觉得应该是因为我安装os的时候选择了美版键旁布局，导致系统不做中文翻译，而ibus的右键preference也不给选择了，卸载重装ibus也没用，最后是系统设置那里更新了中文语言支持，之后才可以了，不过似乎在不需要选择中文支持，不然会使得控制台显示乱码.
  
终于可以输入中文了，这里有一个问题，就是关于ibus设置，在语言支持那里选择应用了中文之后似乎就出现了编码乱码问题，重新取消掉中文就可以了。

#### 问题2：apt-get安装软件  
更新`apt-get`源地址，我选用的是163的。如下：

~~~
deb http://mirrors.163.com/ubuntu/ precise main universe restricted multiverse   
deb-src http://mirrors.163.com/ubuntu/ precise main universe restricted multiverse    
deb http://mirrors.163.com/ubuntu/ precise-security universe main multiverse restricted    
deb-src http://mirrors.163.com/ubuntu/ precise-security universe main multiverse restricted    
deb http://mirrors.163.com/ubuntu/ precise-updates universe main multiverse restricted    
deb http://mirrors.163.com/ubuntu/ precise-proposed universe main multiverse restricted    
deb-src http://mirrors.163.com/ubuntu/ precise-proposed universe main multiverse restricted    
deb http://mirrors.163.com/ubuntu/ precise-backports universe main multiverse restricted    
deb-src http://mirrors.163.com/ubuntu/ precise-backports universe main multiverse restricted    
deb-src http://mirrors.163.com/ubuntu/ precise-updates universe main multiverse restricted   
~~~  

不过有人说163的不全，这个暂时还没遇到，推荐是用sohu，但作为广东用户，163似乎快一点。  
然后就可以用 

~~~ 
sudo apt-get update //更新源  
sudo apt-install appname //安装软件.  
sudo apt-get install chromium-browser //安装chrome  
~~~  
 
#### 问题3：折腾jekyll  
由于我想在linux上直接用自带的python2.x来支持pygments，所以不得不在linux环境下安装ruby+jekyll，为了同步我在win上安装的ruby平台等等，ubuntu本身自带ruby1.8.x，所以要折腾一下ruby的更新，ruby的更新可以用rvm来做，实现平台多版本的管理。  

1. rvm安装，尝试过`sudo apt-get ruby-rvm` 效果不好 ，`rvm install 版本`的时候总是报错，因此寻找其他方式：这篇简单介绍了[rvm的安装和使用](http://rubyer.me/blog/1054/ )，里面提到的直接bash运行来自github的一个shell脚本，我尝试了，结果说我一定是一个开心的ubuntu用户，然后给了我一个[链接](http://stackoverflow.com/questions/9056008/installed-ruby-1-9-3-with-rvm-but-command-line-doesnt-show-ruby-v/9056395#9056395 )回答里的第一项，按照指令操作，下载和编译差不多6分钟+，然后就可以用rvm了，用`rvm use 2.0.0-p451 --default`来设置默认ruby版本。如果你要的版本不在，也会提示用`rvm install 版本号`来安装；  

2. ruby版本弄好了,但是可能装的时候装到了自己当前用户之下，这时候可能需要设置，否则，以后输入rvm会显示`rvm is not a function...`,  
现在知道的方法是使用前，先输入  
`/bin/bash --login`,再输入`rvm use 2.0.0-p451 --default`，  
接下来就是安装jekyll，用`gem`来安装jekyll，一般ruby应该都安装了gem的，  
通过`gem list`可以查看`gem`已经安装了什么？`gem`像`apt-get`有自己的源地址，添加国内比较适合的`gem源`[>>](https://ruby.taobao.org/).  
设置完源之后，就可以用`gem install jekyll`来安装了。

3. 检查下`pygments`是否已经在`gem list`里哦。 

4. git拷贝下自己的博客代码，然后开始运行`jekyll serve`， 嚓，居然报错，execjs没有，`gem list`是有的，回想起来，怀疑估计是js的运行环境，果然win平台我已经装了nodejs的缘故，只能这里也装一下，ps:这么多语言都need，真的大丈夫么？anyway，都折腾了。
 
#### 最后总结印象：  
eos给我印象，dock像mac，不过有点过于简洁，目前貌似无法在桌面放东西，提供的壁纸太漂亮了，舍不得换成指令知识壁纸，再者就是比较难找到一些软件的设置，也真的是过于简单，所以找不到设置项，只能慢慢找了。  

