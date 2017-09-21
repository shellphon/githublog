---
layout: post
title: 异步上传文件实现的浅析
category: Hellocode
keywords: ajaxupload
description: 无刷新异步上传文件的实现浅析
---

文件上传，是一个挺常见的需求， 一般来说多的是上传图片，或者后台系统做报表上传等操作。

平时项目里用到的上传图片，都是成型的相册上传插件，比较少涉及到源码那块的研究，后来涉及到比较特殊的上传图片业务要求，于是开始使用封装的`ajaxUpload`插件, 源码来源url似乎已经访问不了。不过在使用过程中，遇到了一系列问题，于是开始了这篇文章的书写。

### 关于 ajaxUpload 原理

本身做了兼容ie的处理，由于一般表单提交，是带上页面刷新的，要想做到异步无刷新页面提交，一般表单，可以通过ajax来实现，但涉及到文件上传，ajax的支持覆盖度就没那么广了，于是改为了页面刷新，但刷新的不是业务页面，而是建立一个隐藏的iframe，表单提交可以指定target到iframe，通过监听iframe的加载来解析iframe变化的文档内容，获取提交后的返回信息。这就是ajaxUpload的主要逻辑。

这里有个知识点，说到ajax来实现表单异步提交，那么正常的表单提交submit是同步的吗？带着这个疑问，我们来看一下ajaxupload的源码：

{%highlight javascript%}
 /**
 * AJAX Upload ( http://valums.com/ajax-upload/ ) 
 * Copyright (c) Andris Valums
 * Licensed under the MIT license ( http://valums.com/mit-license/ )
 */
(function () {
    /**
     * console.log包装
     */
    function log(){
        if (typeof(console) != 'undefined' && typeof(console.log) == 'function'){            
            Array.prototype.unshift.call(arguments, '[Ajax Upload]');
            console.log( Array.prototype.join.call(arguments, ' '));
        }
    } 

    /**
     添加事件函数
     */
    function addEvent(el, type, fn){
        if (el.addEventListener) {
            el.addEventListener(type, fn, false);
        } else if (el.attachEvent) {
            el.attachEvent('on' + type, function(){
                fn.call(el);
            });
        } else {
            throw new Error('not supported or DOM not loaded');
        }
    }   
    
    /**
    window resize事件
     */
    function addResizeEvent(fn){
        var timeout;
               
        addEvent(window, 'resize', function(){
            if (timeout){
                clearTimeout(timeout);
            }
            timeout = setTimeout(fn, 100);                        
        });
    }    
    
    // 设置getOffset方法
    if (document.documentElement.getBoundingClientRect){
        // Get Offset using getBoundingClientRect
        // http://ejohn.org/blog/getboundingclientrect-is-awesome/
        var getOffset = function(el){
            var box = el.getBoundingClientRect();
            var doc = el.ownerDocument;
            var body = doc.body;
            var docElem = doc.documentElement; // for ie 
            var clientTop = docElem.clientTop || body.clientTop || 0;
            var clientLeft = docElem.clientLeft || body.clientLeft || 0;
             
            // In Internet Explorer 7 getBoundingClientRect property is treated as physical,
            // while others are logical. Make all logical, like in IE8. 
            var zoom = 1;            
            if (body.getBoundingClientRect) {
                var bound = body.getBoundingClientRect();
                zoom = (bound.right - bound.left) / body.clientWidth;
            }
            
            if (zoom > 1) {
                clientTop = 0;
                clientLeft = 0;
            }
            
            var top = box.top / zoom + (window.pageYOffset || docElem && docElem.scrollTop / zoom || body.scrollTop / zoom) - clientTop, left = box.left / zoom + (window.pageXOffset || docElem && docElem.scrollLeft / zoom || body.scrollLeft / zoom) - clientLeft;
            
            return {
                top: top,
                left: left
            };
        };        
    } else {
        // Get offset adding all offsets 
        var getOffset = function(el){
            var top = 0, left = 0;
            do {
                top += el.offsetTop || 0;
                left += el.offsetLeft || 0;
                el = el.offsetParent;
            } while (el);
            
            return {
                left: left,
                top: top
            };
        };
    }
    
    /**
     获取元素的位置偏移
     */
    function getBox(el){
        var left, right, top, bottom;
//        var offset = getOffset(el);
        var offset = jQuery(el).position(),jEl=jQuery(el);
        left = offset.left+(parseFloat(jEl.css("marginLeft"))||0);
        top = offset.top+(parseFloat(jEl.css("marginTop"))||0);
        
        right = left + el.offsetWidth;
        bottom = top + el.offsetHeight;
        
        return {
            left: left,
            right: right,
            top: top,
            bottom: bottom
        };
    }
    
    /**
        添加内联样式
     */
    function addStyles(el, styles){
        for (var name in styles) {
            if (styles.hasOwnProperty(name)) {
                el.style[name] = styles[name];
            }
        }
    }
        
    /**
        复制布局样式
     */    
    function copyLayout(from, to){
        var box = getBox(from);
        
        addStyles(to, {
            position: 'absolute',                    
            left : box.left + 'px',
            top : box.top + 'px',
            width : from.offsetWidth + 'px',
            height : from.offsetHeight + 'px'
        });        
    }

    /**
        创建html
    */
    var toElement = (function(){
        var div = document.createElement('div');
        return function(html){
            div.innerHTML = html;
            var el = div.firstChild;
            return div.removeChild(el);
        };
    })();
            
    /**
     设置唯一id
     */
    var getUID = (function(){
        var id = 0;
        return function(){
            return 'ValumsAjaxUpload' + id++;
        };
    })();        
 
    /**
        获取文件名
     */  
    function fileFromPath(file){
        return file.replace(/.*(\/|\\)/, "");
    }
    
    /**
        获取文件格式后缀
     */    
    function getExt(file){
        return (-1 !== file.indexOf('.')) ? file.replace(/.*[.]/, '') : '';
    }

    function hasClass(el, name){        
        var re = new RegExp('\\b' + name + '\\b');        
        return re.test(el.className);
    }    
    function addClass(el, name){
        if ( ! hasClass(el, name)){   
            el.className += ' ' + name;
        }
    }    
    function removeClass(el, name){
        var re = new RegExp('\\b' + name + '\\b');                
        el.className = el.className.replace(re, '');        
    }
    
    function removeNode(el){
        el.parentNode.removeChild(el);
    }

    /**
        构造器
     */
    jQuery.AjaxUpload = function(button, options){
        // 主要配置
        this._settings = {
            // Location of the server-side upload script
            action: 'upload.php',
            // File upload name
            name: 'userfile',
            // Additional data to send
            data: {},
            // Submit file as soon as it's selected
            autoSubmit: true,
            // The type of data that you're expecting back from the server.
            // html and xml are detected automatically.
            // Only useful when you are using json data as a response.
            // Set to "json" in that case. 
            responseType: false,
            // Class applied to button when mouse is hovered
            hoverClass: 'hover',
            // Class applied to button when AU is disabled
            disabledClass: 'disabled',            
            // When user selects a file, useful with autoSubmit disabled
            // You can return false to cancel upload            
            onChange: function(file, extension){
            },
            // Callback to fire before file is uploaded
            // You can return false to cancel upload
            onSubmit: function(file, extension){
            },
            // Fired when file upload is completed
            // WARNING! DO NOT USE "FALSE" STRING AS A RESPONSE!
            onComplete: function(file, response){
            }
        };
                        
        // Merge the users options with our defaults
        for (var i in options) {
            if (options.hasOwnProperty(i)){
                this._settings[i] = options[i];
            }
        }
        // button修正为dom对象
        if (button.jquery){
            // jQuery object was passed
            button = button[0];
        } else if (typeof button == "string") {
            if (/^#.*/.test(button)){
                // If jQuery user passes #elementId don't break it                  
                button = button.slice(1);                
            }
            
            button = document.getElementById(button);
        }
        
        if ( ! button || button.nodeType !== 1){
            throw new Error("Please make sure that you're passing a valid element"); 
        }
        // 锚 链接button 阻止默认跳转       
        if ( button.nodeName.toUpperCase() == 'A'){
            // disable link                       
            addEvent(button, 'click', function(e){
                if (e && e.preventDefault){
                    e.preventDefault();
                } else if (window.event){
                    window.event.returnValue = false;
                }
            });
        }
        // DOM element
        this._button = button;        
        // DOM element                 
        this._input = null;
        // If disabled clicking on button won't do anything
        this._disabled = false;
        
        // if the button was disabled before refresh if will remain
        // disabled in FireFox, let's fix it
        this.enable();        
        // 核心逻辑，事件处理
        this._rerouteClicks();
    };
    
    // assigning methods to our class
    jQuery.AjaxUpload.prototype = {
        setData: function(data){
            this._settings.data = data;
        },
        disable: function(){            
            addClass(this._button, this._settings.disabledClass);
            this._disabled = true;
            
            var nodeName = this._button.nodeName.toUpperCase();            
            if (nodeName == 'INPUT' || nodeName == 'BUTTON'){
                this._button.setAttribute('disabled', 'disabled');
            }            
            
            // hide input
            if (this._input){
                // We use visibility instead of display to fix problem with Safari 4
                // The problem is that the value of input doesn't change if it 
                // has display none when user selects a file           
                this._input.parentNode.style.visibility = 'hidden';
            }
        },
        enable: function(){
            removeClass(this._button, this._settings.disabledClass);
            this._button.removeAttribute('disabled');
            this._disabled = false;
            
        },
        /**
         * 创建一个看不见的file input
         * <div><input type='file' /></div>
         */
        _createInput: function(){ 
            var self = this;
                        
            var input = document.createElement("input");
            input.setAttribute('type', 'file');
            input.setAttribute('name', this._settings.name);
            
            addStyles(input, {
                'position' : 'absolute',
                // in Opera only 'browse' button
                // is clickable and it is located at
                // the right side of the input
                'right' : 0,
                'margin' : 0,
                'padding' : 0,
                'fontSize' : '480px',                
                'cursor' : 'pointer',
                'fontFamily':'宋体'//解决部分情况下，按钮会下移
            });            

            var div = document.createElement("div");
            div.id="ajaxupload_"+new Date().getTime();
            addStyles(div, {
                'display' : 'block',
                'position' : 'absolute',
                'overflow' : 'hidden',
                'margin' : 0,
                'padding' : 0,                
                'opacity' : 0,
                // Make sure browse button is in the right side
                // in Internet Explorer
                'direction' : 'ltr',
                //Max zIndex supported by Opera 9.0-9.2
                'zIndex': 2147483583
            });
            
            // Make sure that element opacity exists.
            // Otherwise use IE filter            
            if ( div.style.opacity !== "0") {
                if (typeof(div.filters) == 'undefined'){
                    throw new Error('Opacity not supported by the browser');
                }
                div.style.filter = "alpha(opacity=0)";
            }            
            // 监听file事件
            jQuery(input).bind('textchange',function(){
                if ( ! input || input.value === ''){                
                    return;                
                }
                            
                // Get filename from input, required                
                // as some browsers have path instead of it          
                var file = fileFromPath(input.value);
                                
                if (false === self._settings.onChange.call(self, file, getExt(file))){
                    self._clearInput();                
                    return;
                }
                // Submit form when value is changed
                if (self._settings.autoSubmit) {
                    // 调用插件提交方法
                    self.submit();
                }
                
            });
            addEvent(input, 'change', function(){
                if ( ! input || input.value === ''){                
                    return;                
                }
                            
                // Get filename from input, required                
                // as some browsers have path instead of it          
                var file = fileFromPath(input.value);
                                
                if (false === self._settings.onChange.call(self, file, getExt(file))){
                    self._clearInput();                
                    return;
                }
                
                // Submit form when value is changed
                if (self._settings.autoSubmit) {
                    self.submit();
                }
            });            

            addEvent(input, 'mouseover', function(){
                addClass(self._button, self._settings.hoverClass);
            });
            
            addEvent(input, 'mouseout', function(){
                removeClass(self._button, self._settings.hoverClass);
                
                // We use visibility instead of display to fix problem with Safari 4
                // The problem is that the value of input doesn't change if it 
                // has display none when user selects a file           
                input.parentNode.style.visibility = 'hidden';
            });   
            div.appendChild(input);
            self._button.parentNode.appendChild(div);
            this._input = input;
        },
        _clearInput : function(){
            if (!this._input){
                return;
            }            
                             
            // this._input.value = ''; Doesn't work in IE6                               
            removeNode(this._input.parentNode);
            this._input = null;                                                                   
            this._createInput();
            
            removeClass(this._button, this._settings.hoverClass);
        },
        /**
         * 主要是确保点击上传按钮，实际上触发file input的事件
         */
        _rerouteClicks: function(){
            var self = this;
            
            // IE will later display 'access denied' error
            // if you use using self._input.click()
            // other browsers just ignore click()

            addEvent(self._button, 'mouseover', function(){
                if (self._disabled){
                    return;
                }
                                
                if ( ! self._input){
                    self._createInput();
                }
                
                var div = self._input.parentNode;                            
                copyLayout(self._button, div);
                div.style.visibility = 'visible';
                                
            });
            addEvent(self._button, 'click', function(){
                if (self._disabled){
                    return;
                }
                                
                if ( ! self._input){
                    self._createInput();
                }
                
                var div = self._input.parentNode;                            
                copyLayout(self._button, div);
                div.style.visibility = 'visible';
                                
            });
        },
        /**
         * 创建iframe
         */
        _createIframe: function(){
            // We can't use getTime, because it sometimes return
            // same value in safari :(
            var id = getUID();            
             
            // We can't use following code as the name attribute
            // won't be properly registered in IE6, and new window
            // on form submit will open
            // var iframe = document.createElement('iframe');
            // iframe.setAttribute('name', id);                        
 
            var iframe = toElement('<iframe src="javascript:false;" name="' + id + '" />');
            // src="javascript:false; was added
            // because it possibly removes ie6 prompt 
            // "This page contains both secure and nonsecure items"
            // Anyway, it doesn't do any harm.            
            iframe.setAttribute('id', id);
            
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            
            return iframe;
        },
        /**
         创建提交到iframe的表单form
         */
        _createForm: function(iframe){
            var settings = this._settings;
                        
            // We can't use the following code in IE6
            // var form = document.createElement('form');
            // form.setAttribute('method', 'post');
            // form.setAttribute('enctype', 'multipart/form-data');
            // Because in this case file won't be attached to request                    
            var form = toElement('<form method="post" enctype="multipart/form-data"></form>');
                        
            form.setAttribute('action', settings.action);
            // 提交指向iframe
            form.setAttribute('target', iframe.name);                                   
            form.style.display = 'none';
            document.body.appendChild(form);
            
            // Create hidden input element for each data key
            for (var prop in settings.data) {
                if (settings.data.hasOwnProperty(prop)){
                    var el = document.createElement("input");
                    el.setAttribute('type', 'hidden');
                    el.setAttribute('name', prop);
                    el.setAttribute('value', settings.data[prop]);
                    form.appendChild(el);
                }
            }
            return form;
        },
        /**
            获取提交后响应：监听iframe load 事件
         */
        _getResponse : function(iframe, file){            
            // getting response
            var toDeleteFlag = false, self = this, settings = this._settings;   
               
            addEvent(iframe, 'load', function(){                
                // iframe处理完响应后重载移除节点
                if (// For Safari 
                    iframe.src == "javascript:'%3Chtml%3E%3C/html%3E';" ||
                    // For FF, IE
                    iframe.src == "javascript:'<html></html>';"){                                                                        
                        // First time around, do not delete.
                        // We reload to blank page, so that reloading main page
                        // does not re-submit the post.
                        
                        if (toDeleteFlag) {
                            // Fix busy state in FF3
                            setTimeout(function(){
                                removeNode(iframe);
                            }, 0);
                        }
                                                
                        return;
                }
                // 访问iframe文档
                var doc = iframe.contentDocument ? iframe.contentDocument : window.frames[iframe.id].document;
                // fixing Opera 9.26,10.00
                if (doc.readyState && doc.readyState != 'complete') {
                   // Opera fires load event multiple times
                   // Even when the DOM is not ready yet
                   // this fix should not affect other browsers
                   return;
                }
                
                // fixing Opera 9.64
                if (doc.body && doc.body.innerHTML == "false") {
                    // In Opera 9.64 event was fired second time
                    // when body.innerHTML changed from false 
                    // to server response approx. after 1 sec
                    return;
                }
                var response;
                // 处理文档内容
                if (doc.XMLDocument) {
                    // response is a xml document Internet Explorer property
                    response = doc.XMLDocument;
                } else if (doc.body){
                    // response is html document or plain text
                    response = doc.body.innerHTML||doc.documentElement.innerHTML;
                    
                    if (settings.responseType && settings.responseType.toLowerCase() == 'json') {
                        // If the document was sent as 'application/javascript' or
                        // 'text/javascript', then the browser wraps the text in a <pre>
                        // tag and performs html encoding on the contents.  In this case,
                        // we need to pull the original text content from the text node's
                        // nodeValue property to retrieve the unmangled content.
                        // Note that IE6 only understands text/html
                        if (doc.body.firstChild && doc.body.firstChild.nodeName.toUpperCase() == 'PRE') {
                            response = doc.body.firstChild.firstChild.nodeValue;
                        }
                        
                        if (response) {
                            response = eval("(" + response + ")");
                        } else {
                            response = {};
                        }
                    }
                }else {
                    // response is a xml document
                    response = doc;
                }
                // 调用完成请求钩子函数
                settings.onComplete.call(self, file, response);
                
                // Reload blank page, so that reloading main page
                // does not re-submit the post. Also, remember to
                // delete the frame
                toDeleteFlag = true;
                
                // Fix IE mixed content issue
                // 修改src 重新触发load事件以移除节点
                iframe.src = "javascript:'<html></html>';";
            });            
        },        
        /**
         * 提交方法
         */
        submit: function(){                        
            var self = this, settings = this._settings;
            
            if ( ! this._input || this._input.value === ''){                
                return;                
            }
                                    
            var file = fileFromPath(this._input.value);
            
            // 调用onSubmit钩子函数
            if (false === settings.onSubmit.call(this, file, getExt(file))){
                this._clearInput();                
                return;
            }
            
            // 创建iframe和form  
            var iframe = this._createIframe();
            var form = this._createForm(iframe);
            
            // assuming following structure
            // div -> input type='file'
            removeNode(this._input.parentNode);            
            removeClass(self._button, self._settings.hoverClass);
                        
            form.appendChild(this._input);
            // 提交表单       
            form.submit();

            // request set, clean up                
            removeNode(form); form = null;                          
            removeNode(this._input); this._input = null;
            
            // 绑定iframe事件处理响应数据
            this._getResponse(iframe, file);            

            // 重新创建input          
            this._createInput();
        }
    };
})(); 
{%endhighlight%}

代码说短不短，说长也不长，因为作为插件，业务需要被修改过，未能找到比较完整的源码，不过核心逻辑还是比较清晰的。

画了个简单示意图，即在按钮处覆盖透明的div，实现当点击按钮时，实际触发了input file的点击，当input change事件触发时，又调用了插件的submit方法，生成iframe和form，并提交form到iframe，最后监听iframe load事件处理响应信息。

![image](http://dont27.qiniudn.com/ajaxupload.png)
<a href="http://dont27.qiniudn.com/ajaxupload.png" target="_blank">查看原图</a>

结合代码看，会发现，iframe的onload事件绑定是在form submit之后，如果前面说的表单提交是同步行为的话，那么在这里就会有疑惑了，但这里恰恰好说明了，submit是一个异步行为，通过断点调试也可以发现这一问题，就是当js执行到submit之后，在后续js还没执行结束之前，我们看到network是不会立即发起http请求的（chrome 开发者工具查看），后来在[Stack Overflow](https://stackoverflow.com/questions/7985930/is-form-submit-synchronous-or-async)得到类似的说明。

测试例子代码：

{%highlight html%}
<form id="form" action="/api/to" method="post">
    <input type="text" name="hey" value="dont">
    <input type="submit" id="btn" value="submit">
</form>
<script>
    (function() {
        var form = document.querySelector('#form'),
            btn = document.querySelector('#btn');
            btn.onclick = function(){
                console.log('click');
                form.submit();
                console.log('after submit action');//设断点查看network
                setTimeout(function(){
                    console.log('timeout quick');//设断点查看network和console
                },0);
            };
            form.onsubmit=function(){
                console.log('submit');
            };
    })();
</script>
{%endhighlight%}

服务我用koa1实现的

{%highlight javascript%}
//注意koa1的话，koa-static最好用2.x,不然node版本不支持async的话可能报错
var app = require('koa')();
var router = require('koa-router')();
var serve = require('koa-static');

router.get('/',function *(next){
    this.body = '<p>hello world</p>';
});
router.post('/api/to',function *(next){
    console.log('catch the request');
    console.log(this.request);
    this.body = yield new Promise(function(reso,reje){
                setTimeout(function(){
                    reso('hellp');
                },2000)
            }).then(function(data){
                return data
            });
});
app.use(serve(__dirname));
app.use(router.routes());
app.listen(4008);
{%endhighlight%}

以上代码实验结果是，表单提交事件会在click事件回调代码执行完毕之后才发起，console输出结果是： 

> click->after submit action->submit->timeout quick 

### 小困惑

最近在使用该插件实现上传excel文件时，遇到了一个坑（实际上并非这个插件本身的坑），在实际测试过程中，遇到了读取iframe document时出现跨域报错，通过一系列简单的示例代码，却找不到问题所在，后来发现iframe的document里需要手动设置`domain=xxx;`才能正常供父页面访问，于是关注点迁移到了`domain`身上，因为使用该插件结合的jquery库，是全站公共库文件，其中添加了`domain`的主域设置，查了一遍资料发现，`domain`如果手动设置了，那么iframe的页面不管是否跨域，如果想要访问得了必须也显式设置`domain`才可以访问（当然非跨子域的那些跨域设置了也没用）。

### 总结

其实，说来这个实现还算简单，通过form target指向iframe的形式，间接实现无刷新页面异步提交。

当然除了这个比较广泛的实现外，现在新型的实现也早就有的了，具体可以参考 阮一峰的博文[《文件上传的渐进式增强》](http://www.ruanyifeng.com/blog/2012/08/file_upload.html)，这里就不描述了。
