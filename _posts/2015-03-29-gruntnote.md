---
layout: post
title: grunt学习笔记
category: Tool
keywords: grunt,笔记
description: grunt学习笔记
---
平时项目要么用`ant`，要么用`fis`来自动化构建项目.

最近兴起，就学习下`grunt`的用法，并尝试着用来替换还在用`ant`处理前端资源的项目。

先是查找学习资源咯，[官网](http://www.gruntjs.com)少不了，但英文看着累的时候可以用用[中文版](http://www.gruntjs.org/docs/getting-started.html)。ps:中文版一些链接是不是又跳到英文版去了。

然后跟着教程走一遍。恩，我这里描述下。

+ 首先，装一个 grunt-cli :    `npm install -g grunt-cli` //别告诉我你不知道`npm`是什么？`nodejs`装了吧？

+ 其次，准备一个项目目录（有实际项目就用实际项目的目录咯。）假设为 `/gruntest/`
命令行`cd` 到 `gruntest`

+ 要有一个`package.json`.  这个`json`呢，`npm init` 就可以自动帮你建一个了，通常内容只需要`name`, `version` 也就差不多啦。

+ 然后就是建一个`Gruntfile.js` 。这个是`grunt`的配置执行程序文件来的。

内容如下：
{% highlight javascript linenos%}
module.exports = function(grunt){
  grunt.loadNpmTasks('grunt-contrib-uglify');//加载插件
  grunt.initConfig({//配置：配置数据对象，包括一些插件的需要用到的一些配置数据
  pkg: grunt.file.readJSON('package.json'),
  uglify:{//这个需要先项目本地安装uglify插件
   options: {
    banner:'/*! this is uglify test- '+'<%= grunt.template.today("yyyy-mm-dd") %> */'
   },
   taskName:{//任务目标
    files: {//文件对象。这里是把main.js wxshare.js压缩合并成test.js
     'build/js/test.js':['js/main.js','js/wxshare.js']
    }
   }
  }
 });
 grunt.registerTask('default',['uglify']); //default 是默认的grunt任务。当执行  grunt时就会运行，后面参数则是实际任务
};
{% endhighlight %}

 运行前要保证已经装了要用的`uglify`插件，此时执行
> npm install grunt-contrib-uglify --save-dev

这样就可以愉快的 `grunt` 了

## 一些好用的插件

从教程来说，基本很简单，关键是需要一些常用插件来更好的提高生产力。

> `grunt-contrib-uglify` 压缩合并js  
`grunt-contrib-cssmin` 压缩合并css  
`grunt-contrib-jshint` js语法检测  
`grunt-contrib-clean` 删文件  
`grunt-contrib-wacth` 监听文件修改  
`grunt-usemin` : 将html中的未优化合并的静态资源引用替换为优化合并版  
`time-grunt`:任务运行耗时  
`load-grunt-tasks`:加载package.json定义的依赖插件  

`grunt-contrib-` 是官方提供的插件。

有上面那些插件，基本的前端资源处理也就搞定。（我指的是我遇到的一些项目，不包括`less`和图片压缩等等。）

### 下面讲述下，学习中，我的一些见解。

### 关于文件对象配置
+ #### 单独压缩的配置：就是一个文件压缩成一个文件（区别于几个文件合并成一个文件那种情况）
{% highlight javascript linenos%}
files:[{
        expand: true,
        //相对路径
        cwd: 'css/',
        src: '*.css',
        dest: 'build/css/',
        rename: function (dest, src) {  
                  var folder = src.substring(0, src.lastIndexOf('/'));  
                  var filename = src.substring(src.lastIndexOf('/'), src.length);  
                  //  var filename=src;  
                  filename = filename.substring(0, filename.lastIndexOf('.'));  
                  var fileresult=dest + folder + filename + '.min.css';  
                  grunt.log.writeln("现处理文件："+src+"  处理后文件："+fileresult);  
                  return fileresult;  
                  //return  filename + '.min.js';  
              }
    }
]
{% endhighlight %}

+ #### 关于配置dest src 和files

通常：

> files:{ destUrl : srcUrl }

或者

> files:[{src:srcUrl, dest:destUrl}]

或者//与files同级

> src:srcUrl,
dest:destUrl

###从API文档摘录一些知识点：
+ `grunt.config` : `grunt.initConfig`即`grunt.config.init`  
   `initConfig` 里配置的内容，可以通过`grunt.config.get(xx)`获取到对应的内容对象。

+ `grunt.registerTask`即`grunt.task.registerTask` 
    
+ `grunt.loadTasks`即`grunt.task.loadTasks` 加载外部的任务注册//这里思考一下就明白，原来插件用loadTasks加载就是在注册任务。  
//因此，如何自定义自己的小任务?直接用 
{% highlight javascript linenos%}
grunt.registerTask(taskName, 'task description', function(){
    doSomeThing();//
})
{% endhighlight %}

+ 命令行输出: `grunt.log.write();` 

+ 写文件操作：`grunt.file.write(filename, filecontent);`

### 最后附上，学习成果。要是再加点图片压缩啥的，就更好了。

{% highlight javascript linenos%}
module.exports = function(grunt){
 require('time-grunt')(grunt);
 require('load-grunt-tasks')(grunt,{scope: 'devDependencies'});
 grunt.initConfig({
  pkg: grunt.file.readJSON('package.json'),
  vers: grunt.file.readJSON('vers.json'),
  uglify:{//压缩合并js
   options: {
    banner:'/*!vers:<%=vers.v%> '+'update: <%= grunt.template.today("yyyy-mm-dd") %> */'
   },
   alljs:{
    files: [{
                        expand: true,
                        //相对路径
                        cwd: '../src/js/',
                        src: '*.js',
                        dest: 'dist/js/'
                }],
   }
  },
  cssmin:{//压缩合并css
   options: {
   },
   /*task1:{
     dest:'dist/css/test.css',
     src:['css/main.css','css/cssdraw.css']
   },*/
   allCss:{
    files:[{
                        expand: true,
                        //相对路径
                        cwd: '../src/css/',
                        src: ['*.css','!*old.css','!reset.css','!layout.css','!btns.css','!global.css','!form.css'],
                        dest: 'tmp/css/'
                }]
            },
            global:{
             files:[{
              src:['../src/css/reset.css','../src/css/layout.css','../src/css/btns.css','../src/css/global.css','../src/css/form.css'],
              dest: 'tmp/css/global.css'
             }
             ]
            }
  },
  clean:{//删除文件
   options: {
   },
   dist:{
     src:'dist/*'
   },
   tmp:{
    src:'tmp/'
   }
  },
  watch: {//监控文件改动  暂时不用
         watchcss: {
             files: ['../src/css/*.css'],
             tasks: ['cssmin'],
             options: {
                 // Start another live reload server on port 1337
                 livereload: 1337
             }
         }
     },
'string-replace':{//配置替换内容
		   dist: {
		           files:[{
		                        expand: true,
		                        //相对路径
		                        cwd: 'tmp/css',
		                        src: '*.css',
		                        dest: 'dist/css/'
		                    }],
		           options: {
		             replacements: [{
		               pattern: /@IMAGE_VERSION@/g,
		               replacement:'<%=vers.v%>'
		               }]
		           }
		   }
     },
     my:{//自定义一些配置参数自己用
      foo:123,
      bar:'hi'
     }
 });
 grunt.registerTask('increaseVersion','increase the versions',function(){//自定义版本用来自增版本号
  var versionObj = grunt.file.readJSON('vers.json');
  grunt.log.write('当前版本号：'+versionObj.v);
  grunt.file.write('vers.json','{"v":'+(++versionObj.v)+'}')
 });
 grunt.registerTask('default',['clean:dist','uglify','cssmin','string-replace','clean:tmp','increaseVersion']);
};
{% endhighlight %}

