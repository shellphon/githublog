---
layout: post
title: github上搭建博客
---

1. 首先要有github账号。注册省略。
  - 建立库：github提供两种pages模式，都是按 username.github.io来访问 ，一种是建立名为username.github.io的repo，另一种则是其他repo的setting处，选择自动创建页面（实际是用来做项目页面介绍的，会在项目建立gh-pages分支，所以自动创建出来的页面是以username.github.io/repo_name来访问的，）
  - git知识：常用命令
    + > git clone https://github.com/username/reponame #拷贝服务器的代码库
    + > git pull #从远程服务器更新下来
    + > git push origin master #推送代码更新到远程服务器，如果是gh-pages分支，则一般是 git push origin gh-pages
    + > git add filename #将文件放入stage区
    + > git commit -m "comment content" #提交代码
2. 搭建本地环境：
  github上提供的是静态页面，而github提供jekyll技术来实现博客；
  - (安装jekyll)[http://skyinlayer.com/blog/2014/01/25/jekyll-1/] 教程 ：主要包括ruby jekyll
3. 配置
  - 项目文件结构
    + 
    + 
4. 外观主题：
  这个比较考个人的审美问题，可以自己写css也可以用(其他)[https://github.com/jekyll/jekyll/wiki/Sites]开放的
4. 配置补充
   - 使用markdown
   - 嵌入gist代码
   - 加入外部评论
   - 外部图片
   - 分页