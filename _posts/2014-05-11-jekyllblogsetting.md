---
layout: post
title: github上搭建博客
---

1. 首先要有github账号。注册省略。    
    - 建立库：github提供两种pages模式，都是按 username.github.io来访问 ，一种是建立名为username.github.io的repo，另一种则是其他repo的setting处，选择自动创建页面（实际是用来做项目页面介绍的，会在项目建立gh-pages分支，所以自动创建出来的页面是以username.github.io/repo_name来访问的，）
    - git知识：常用命令
        +  git clone https://github.com/username/reponame #拷贝服务器的代码库
        +  git pull #从远程服务器更新下来#拷贝服务器的代码库
        +  git push origin master #推送代码更新到远程服务器，如果是gh-pages分支，则一般是 git push origin gh-pages
        +  git add filename #将文件放入stage区
        +  git commit -m "comment content" #提交代码
2. 搭建本地环境：    
  github上提供的是静态页面，而github提供jekyll技术来实现博客；
    - [安装jekyll](http://skyinlayer.com/blog/2014/01/25/jekyll-1/) 教程 ：主要包括ruby jekyll
3. 配置
   - 项目文件结构
     + _layouts: 目录，用于放置模板文件, 一般有default.html和post.html    
     > ```
<!DOCTYPE html>    
  <html>    
    <head>   
          <!-- jekyll代码会被自动转换，这里用了反斜杠过滤 --> 
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />    
          <meta name="author" content="Dont" />    
          <link rel="shortcut icon" href="{\{ site.baseurl \}}/fav.ico" type="image/x-icon">    
          <title>{\{ page.title \}}</title>    
          <link rel="stylesheet" href="{\{ site.baseurl \}}/css/dontblog.css" type="text/css" media="screen, projection">    
          <script type="text/javascript">    
          </script>    
        </head>    
        <body id="{\{ page.body_id \}}">    
          <div class="container">    
          {\{ content \}}    
          </div>    
        </body>    
      </html>     
```
      + _posts:目录，用于放置日志，一般以类似2014-05-12-blogname.md或者.html命名, posts文件可以是markdown格式的文件也可以是html,可以在其头部加入yaml头部变量，以---包围，并且行首不得有空格,头部变量声明layout:default 会引入上面提到的layouts模板文件.
      + _site:自动生成目录，一般不放到github的，在根目录下新建.gitignore文件，然后写下 `/_site` ,git就能忽略其存在，不用每次都提醒你要commit
      + _config.yml 配置文件，一般写下baseurl等如`baseurl: /`或者`baseurl:/reponame`等等

4. 外观主题：
  这个比较考个人的审美问题，可以自己写css也可以用[其他](https://github.com/jekyll/jekyll/wiki/Sites)开放的
4. 配置补充
   - 使用markdown
      + 需要安装rdiscount解析markdown,_config.yml要写入 markdown: rdiscount
   - 嵌入gist代码
      + 内容写入 {\% gist gist_id \%} #gist_id指的是gist文件的生成的唯一id.
   - 加入外部评论
      国外注册disqus,国内可以用多说（貌似）。
      disqus, 注册后自己创建,设置好shortname;之后要加入评论的页面写入下面代码，然后写入下列代码
      >```
        <div id="disqus_thread"></div>    
        <script type="text/javascript">    
        var disqus_shortname = 'Shellphon'; // 注意，这里的 example 要替换为你自己的短域名    
        /* * * 下面这些不需要改动 * * */    
        (function() {     
          var dsq = document.createElement('script');    
dsq.type = 'text/javascript';    
dsq.async = true;    
          dsq.src = 'http://' + disqus_shortname + '.disqus.com/embed.js';    
          (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);    
        })();    
        </script>    
        <noscript>Please enable JavaScript to view the <a href="http://disqus.com/?ref_noscript">comments powered by Disqus.</a></noscript>        
        <a href="http://disqus.com" class="dsq-brlink">blog comments powered by <span class="logo-disqus">Disqus</span></a>
      ```
   - 外部图片    
     图片托管, 找了一下, 似乎国内七牛不错, 所谓外部图片, 也就是用src用外部链接.
   - 分页    
     暂时没需求,往后研究.