---
layout: post
title: fis源码笔记
category: Hellocode
keywords: fis
description: 走读fis源码，记录学习
---

第二次走读[fis源码](https://github.com/fex-team/fis)了，带着上一次读源码的笔记，再来读一遍时，有了更好的认识，虽然可能不够全面，但觉得有必要写文章记录一下。

我本地下载的fis版本是 `1.10.1`

### 目录结构

目录结构也算很清晰了，由于其是作为命令程序的存在，所以有`bin`目录

主要结构如下：（不全）

> fis    
> ---| bin  
> -----| fis  
> ---| node_modules  
> -----| fis-command-*  
> -----| fis-kernel  
> -----| fis-optimizer-*  
> -----| fis-postprocessor-*  
> -----| fis-preprocessor-*  
> -----| fis-spriter-csssprites  
> ---| fis.js  

这里我主要分析的是 fis、fis.js、fis-command-release、fis-kernel，其他的略过。

我们一般使用fis命令来执行：

> $ fis release -d online -p -m -o -D -w

首先，这个命令会执行 bin/fis 文件，内容很简单，就是直接调用了fis.js模块的`cli.run`方法

我们看fis.js的主要代码片段：

{%highlight javascript%}
// fis用的是fis-kernel模块
var fis = module.exports = require('fis-kernel');
// 配置基本的模块插件
fis.config.merge({
    modules : {
        preprocessor: {
            js: 'components',
            css: 'components',
            html: 'components'
        },
        postprocessor : {
            js : 'jswrapper'
        },
        optimizer : {
            js : 'uglify-js',
            css : 'clean-css',
            png : 'png-compressor'
        },
        spriter : 'csssprites',
        packager : 'map',
        deploy : 'default',
        prepackager: 'derived'
    }
});

fis.cli = {};

//省略一系列代码

fis.cli.run = function(argv){

    fis.processCWD = process.cwd();

    if(hasArgv(argv, '--no-color')){
        fis.cli.colors.mode = 'none';
    }

    var first = argv[2];
    if(argv.length < 3 || first === '-h' ||  first === '--help'){
        fis.cli.help();
    } else if(first === '-v' || first === '--version'){
        fis.cli.version();
    } else if(first[0] === '-'){
        fis.cli.help();
    } else {
        //register command
        var commander = fis.cli.commander = require('commander');
        var cmd = fis.require('command', argv[2]);
        cmd.register(
            commander
                .command(cmd.name || first)
                .usage(cmd.usage)
                .description(cmd.desc)
        );
        commander.parse(argv);
    }
};
{%endhighlight%}

可以看到命令行主要是用了`commander`来控制命令行，其中

{%highlight javascript%}
var cmd = fis.require('command', argv[2]);
{%endhighlight%}

我们知道`argv[2]`，指代的是`release`.（argv[0] 是`node`）,这里实际是获取了`fis-command-release`. 这个后面说明。

于是可以明确，当使用了`fis release`指令的时候，经过了`bin/fis`->`fis.js`->`fis-command-release`的一个走读流程。

### 核心源码

从fis.js可以看到, fis核心实现是`fis-kernel`模块，其中该模块又分为`cache`、`compile`、`config`、`file`、`log`、`project`、`release`、`uri`、`util`这几个部分。

从命名上，可以看出大概：缓存、编译、配置、文件（fis文件对象）、日志、项目、发布、资源定位、工具。

其中，release是fis release的主要逻辑，compile则是release的细化单元之一。

#### 面向对象

fis-kernel自身的代码主要是对fis这个对象的一个整合以及面向对象的补充。

{%highlight javascript%}
Function.prototype.derive = function(constructor, proto){
    if(typeof constructor === 'object'){
        proto = constructor;
        constructor = proto.constructor || function(){};
        delete proto.constructor;
    }
    var parent = this;
    var fn = function(){
        parent.apply(this, arguments);
        constructor.apply(this, arguments);
    };
    var tmp = function(){};
    tmp.prototype = parent.prototype;
    var fp = new tmp(),
        cp = constructor.prototype,
        key;
    for(key in cp){
        if(cp.hasOwnProperty(key)){
            fp[key] = cp[key];
        }
    }
    proto = proto || {};
    for(key in proto){
        if(proto.hasOwnProperty(key)){
            fp[key] = proto[key];
        }
    }
    fp.constructor = constructor.prototype.constructor;
    fn.prototype = fp;
    return fn;
};

//factory
Function.prototype.factory = function(){
    var clazz = this;
    function F(args){
        clazz.apply(this, args);
    }
    F.prototype = clazz.prototype;
    return function(){
        return new F(arguments);
    };
};

var fis = module.exports = {};

//register global variable
Object.defineProperty(global, 'fis', {
    enumerable : true,
    writable : false,
    value : fis
});
fis.emitter = new (require('events').EventEmitter);
//time for debug
fis.time = function(title){
    console.log(title + ' : ' + (Date.now() - last) + 'ms');
    last = Date.now();
};
//log
fis.log = require('./lib/log.js');

//require
fis.require = function(){
    var path;
    var name = Array.prototype.slice.call(arguments, 0).join('-');
    if(fis.require._cache.hasOwnProperty(name)) return fis.require._cache[name];
    var names = [];
    for(var i = 0, len = fis.require.prefixes.length; i < len; i++){
        try {
            var pluginName = fis.require.prefixes[i] + '-' + name;
            names.push(pluginName);
            path = require.resolve(pluginName);
            try {
                return fis.require._cache[name] = require(pluginName);
            } catch (e){
                fis.log.error('load plugin [' + pluginName + '] error : ' + e.message);
            }
        } catch (e){
            if (e.code !== 'MODULE_NOT_FOUND') {
                throw e;
            }
        }
    }
    fis.log.error('unable to load plugin [' + names.join('] or [') + ']');
};
fis.require._cache = {};
fis.require.prefixes = ['fis'];
//system config
fis.config = require('./lib/config.js');
//utils
fis.util = require('./lib/util.js');
//resource location
fis.uri = require('./lib/uri.js');
//project
fis.project = require('./lib/project.js');
//file
fis.file = require('./lib/file.js');
//cache
fis.cache = require('./lib/cache.js');
//compile kernel
fis.compile = require('./lib/compile.js');
//release api
fis.release = require('./lib/release.js');
//package info
fis.info = fis.util.readJSON(__dirname + '/package.json');
//kernel version
fis.version = fis.info.version;
{%endhighlight%}

开篇就扩展了Function原型两个方法，`derive`和`factory`.

factory其实很好理解，就是返回一个普通方法，省去了使用原方法new构造模式的繁琐。

![image](http://dont27.qiniudn.com/fis-1.png)
<a href="http://dont27.qiniudn.com/fis-1.png" target="_blank">查看原图</a>

derive 细看，其实是多继承，派生出一个构造器，它继承了原函数以及提供参数的构造器和原型对象。

![image](http://dont27.qiniudn.com/fis-2.png)
<a href="http://dont27.qiniudn.com/fis-2.png" target="_blank">查看原图</a>

在fis源码模块中多次用到了这两个方法，且先看`fis.file`，在lib/file.js里

{%highlight javascript%}
module.exports = File.factory();
{%endhighlight%}

于是如果使用`fis.file(xx)`,就是相当于`new File()`.

再看`fis.config`, lib/config 

{%highlight javascript%}
var Config = Object.derive({});
module.exports = (new Config).init(DEFAULE_SETTINGS);
{%endhighlight%}

则`fis.config`代表的是一个已经实例化的Config对象。

了解了这两个方法的作用，就能比较好的理解lib里的代码了。

#### 插件配合方式 与 pipe

fis的插件主要分三种：单文件编译插件、打包插件、命令行插件，详见[插件扩展点列表](http://fex.baidu.com/fis-site/docs/more/extension-point.html)

fis-kernel入口文件的代码里，声明里`fis.require`方法，这是fis模块化处理的一个核心点，并且还使用了成员变量`_cache`来缓存模块，fis的每一个插件都是一个独立的npm包，那么总需要有`require`，而`fis.require`就实现了这个。

fis.require要结合实际应用来看才容易理解，这个涉及到`pipe`方法的使用。

代码里涉及到pipe的主要有三处.

util的pipe工具方法：

{%highlight javascript%}
_.pipe = function(type, callback, def){
    var processors = fis.config.get('modules.' + type, def);
    if(processors){
        var typeOf = typeof processors;
        if(typeOf === 'string'){
            processors = processors.trim().split(/\s*,\s*/);
        } else if(typeOf === 'function'){
            processors = [ processors ];
        }
        type = type.split('.')[0];
        processors.forEach(function(processor, index){
            var typeOf = typeof processor, key;
            if(typeOf === 'string'){
                key = type + '.' + processor;
                processor = fis.require(type, processor);
            } else {
                key = type + '.' + index;
            }
            if(typeof processor === 'function'){
                var settings = fis.config.get('settings.' + key, {});
                if(processor.defaultOptions){
                    settings = _.merge(processor.defaultOptions, settings);
                }
                callback(processor, settings, key);
            } else {
                fis.log.warning('invalid processor [modules.' + key + ']');
            }
        });
    }
};
{%endhighlight%}

compile的内部pipe方法：

{%highlight javascript%}
function pipe(file, type, ext, keep){
    var key = type + ext;
    fis.util.pipe(key, function(processor, settings, key){
        settings.filename = file.realpath;
        var content = file.getContent();
        try {
            fis.log.debug('pipe [' + key + '] start');
            var result = processor(content, file, settings);
            fis.log.debug('pipe [' + key + '] end');
            if(keep){
                file.setContent(content);
            } else if(typeof result === 'undefined'){
                fis.log.warning('invalid content return of pipe [' + key + ']');
            } else {
                file.setContent(result);
            }
        } catch(e) {
            //log error
            fis.log.debug('pipe [' + key + '] fail');
            var msg = key + ': ' + String(e.message || e.msg || e).trim() + ' [' + (e.filename || file.realpath);
            if(e.hasOwnProperty('line')){
                msg += ':' + e.line;
                if(e.hasOwnProperty('col')){
                    msg += ':' + e.col;
                } else if(e.hasOwnProperty('column')) {
                    msg += ':' + e.column;
                }
            }
            msg += ']';
            e.message = msg;
            error(e);
        }
    });
}
{%endhighlight%}

然后就是compile中的pipe调用，process方法：

{%highlight javascript%}
function process(file){
    if(file.useParser !== false){
        pipe(file, 'parser', file.ext);
    }
    if(file.rExt){
        if(file.usePreprocessor !== false){
            pipe(file, 'preprocessor', file.rExt);
        }
        if(file.useStandard !== false){
            standard(file);
        }
        if(file.usePostprocessor !== false){
            pipe(file, 'postprocessor', file.rExt);
        }
        if(exports.settings.lint && file.useLint !== false){
            pipe(file, 'lint', file.rExt, true);
        }
        if(exports.settings.test && file.useTest !== false){
            pipe(file, 'test', file.rExt, true);
        }
        if(exports.settings.optimize && file.useOptimizer !== false){
            pipe(file, 'optimizer', file.rExt);
        }
    }
}
{%endhighlight%}

关于process处理，这里其实是单文件编译的一个过程，详见[编译过程运行原理](http://fex-team.github.io/fis-site/docs/more/fis-base.html)。

process的每一个pipe调用，实际就是对file对象的一次操作处理，以`preprocessor`为例。

如果是处理一个js文件，那么如下

~~~
pipe(file, 'preprocessor', '.js');
//转化成
fis.util.pipe('preprocessor.js', function cb(){})
~~~

回头看util的pipe实现，会发现，其实这里pipe的主要作用是把对应的插件通过fis.require引入进来，然后回调给fis.util.pipe的第二参数回调函数使用。

最后得到的回调参数：

~~~
processor = fis.require('preprocessor', 'components');//结合前面提到的配置
~~~

最终到了fis.require处，其实就是得到一个`require('fis-preprocessor-components')`

可参考[fis插件调用机制](http://fex.baidu.com//fis-site/docs/more/how-plugin-works.html)

到这里，就比较明了，插件的配合，通过fis配置来决定编译文件每个步骤需要的插件配置，最终通过fis.require来获取到对应的插件模块，然后在pipe函数里执行逻辑中，针对file对象进行一系列操作，重新`setContent`.

每一层的pipe处理，基本都是在对file对象进行getContent和setContent。

在[插件开发](http://fex.baidu.com/fis-site/docs/dev/plugin.html)处，fis介绍了编译插件和打包插件的开发方法。

由上面介绍的pipe方法，可知编译插件的代码开发格式大致如下：

{%highlight javascript%}
module.exports = function(content, file, settings){
    return xxx;
};
{%endhighlight%}

而打包插件的开发格式则是：

{%highlight javascript%}
module.exports = function (ret, conf, settings, opt) {
    // ret.src 所有的源码，结构是 {'<subpath>': <File 对象>}
    // ret.ids 所有源码列表，结构是 {'<id>': <File 对象>}
    // ret.map 如果是 spriter、postpackager 这时候已经能得到打包结果了，
    //         可以修改静态资源列表或者其他
}
{%endhighlight%}

两者的主要区别在于构造的插件函数接收参数不同，原因在于源码处的实现：（编译插件在上面提及了）

{%highlight javascript%}
  //package callback
    var cb = function(packager, settings, key){
        fis.log.debug('[' + key + '] start');
        packager(ret, conf, settings, opt);
        fis.log.debug('[' + key + '] end');
    };
    //prepackage
    fis.util.pipe('prepackager', cb, opt.prepackager);
    //package
    if(opt.pack){
        //package
        fis.util.pipe('packager', cb, opt.packager);
        //css sprites
        fis.util.pipe('spriter', cb, opt.spriter);
    }
    //postpackage
    fis.util.pipe('postpackager', cb, opt.postpackager);
{%endhighlight%}

打包扩展的打包器使用直接通过`fis.util.pipe`,设定了回调函数，而编译插件则是通过内部pipe方法来指定回调函数。


#### ext处理

在各种插件pipe或者是compile流程里的standard方法，都存在着对文件内容字符串进行内容处理的过程。

关于standard有这么一句描述：

> standard(标准化处理)：前面两项处理会将文件处理为标准的js、css、html语法，fis内核的标准化处理过程对这些语言进行 三种语言能力 扩展处理。这也就意味着，使用less、coffee等语法在fis系统中一样具备 资源定位、内容嵌入，依赖声明 的能力。该过程 不可扩展。

standard对资源定位、内容嵌入、依赖声明的处理，代码篇幅比较略长，就不贴了：[传送门>>](https://github.com/fex-team/fis-kernel/blob/master/lib/compile.js#L397~L486),standard主要两个步骤，一个是文件内容处理转换，另一个则是对转换内容进行识别然后还原内容。

这里对`html\css\js`分别使用`extHtml\extCss\extJs`方法进行内容处理：主要是利用正则，给各种约定的格式做转换，转为fis语法糖，便于后面逻辑对依赖和定位的读取，大概格式的转换例子，可以参考[扒一扒前端构建工具FIS的内幕](http://www.iamaddy.net/2014/10/inside-fis-kernel/)

涉及到的正则，可以利用[这里解析](https://www.debuggex.com/)来方便理解。

#### 缓存

fis使用了文件缓存以减少重复编译，缓存的位置取决于lib/project.js处的getTempPath.

fis主要缓存分两种，用了两个目录来分开，一个是conf，即配置文件缓存，另一个则是编译文件缓存，后者内容比较多。

缓存内容基本包含两部分 ，一个是.tmp文件，一个是.json文件，后者是缓存文件的信息内容，比如依赖、生成时间戳等等信息。

对于编译文件缓存，则会区分目录来指明是纯release，还是带优化、带域名等情况。

编译文件缓存，在[compile.js中做处理](https://github.com/fex-team/fis-kernel/blob/49db1c91564f90ea77aefb9feb2b6c5c755df2cd/lib/compile.js#L24~L43)，当文件命中缓存时，直接使用缓存内容，不经过process处理。

### 总结

主心骨代码基本走读了一遍，记录了fis源码里我自认为比较核心部分的内容。在代码实现里，我注意到了一点，那就是多处利用了函数参数为对象的情况，函数通过修改实参属性的方式来改变数据，比如，`var obj={}; function change(obj){obj.name="hello";}`.这点刚开始没注意，总会在走读流程上不自觉产生疑惑。再次翻看官方文档，发现其实好多我可以从文档入手，这样走读代码会更加方便理解，真是走了不少弯路。后续准备细读一下后面关于打包的处理细节和正则的应用。