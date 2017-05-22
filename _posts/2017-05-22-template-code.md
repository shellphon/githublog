---
layout: post
title: 学习模板引擎基本原理
category: Hellocode
keywords: template
description: 简易的模板引擎原理
---

之前看了 小胡子哥 关于[模板引擎原理的博文](http://www.cnblogs.com/hustskyking/p/principle-of-javascript-template.html)，对模板引擎有了大致的理解，重新来看这篇文章，又有了点思考。这里我做一下整理。

最开始，我们遇到要拼装dom的时候，都是很简单的字符串拼装，比如

{%highlight javascript%}
var data = {name:'dont', study:'前端'};

var tmpl = ['{name} 说：',
            '他想学{study}'    
        ].join('');
console.log(tmpl.replace(/{name}/g, data.name).replace(/{study}/g, data.study));
{%endhighlight%}

这种写起来好像没啥问题，但写多了挺烦的，dom结构一长，要渲染的数据一多，就要想方法做函数封装以及代码优化。

而模板引擎会省心很多，说起模板引擎，其实现的主要功能有几点：变量替换、条件判断、对象遍历。

从上面的字符串拼装代码可以看出，主要字符串拼装就是实现变量替换（`replace`正则替换）。

所以刚开始实现可以这么写：

{%highlight javascript%}
var tplEng = function(tpl, data){
    var reg = /<%\s*([^%>]+?)\s*%>/g;
    return tpl.replace(reg, function(all, param){
        return data[param]; 
    });
};
var tmpl = "<%name%>说：他想学<% study %>";
console.log(tplEng(tmpl, {name:"dont",study:"挣钱"}));
{%endhighlight%}

但是这么写，不支持子对象，即

{%highlight javascript%}
var tmpl = "<%name%>说：他想学<% study.name %>";
console.log(tplEng(tmpl, {name:"dont",study:{name:"挣钱"}}));
{%endhighlight%}

虽然可以这么写：

{%highlight javascript%}
var tplEng = function(tpl, data){
    var reg = /<%\s*([^%>]+?)\s*%>/g;
    return tpl.replace(reg, function(all, param){
        var obj = data;
        var attr = param.split('.');
        attr.forEach(function(e){
          obj = obj[e]
        });
        return obj; 
    });
};
{%endhighlight%}

不过，这个就跟后面条件判断以及对象遍历思路没啥联系了。

反观，胡子哥的做法，则是在拼装字符串时，用到变量替换的部分还是照常用js变量代码：`return data.name + '说：他想学'+ data.study.name;`

这样就要考虑组装字符串以及结合js变量的情形，想想，对于`<%name%>说：他想学<% study.name %>`这样的模板，是不是要处理成`name + "说：他想学"+ study.name`,因为这里要从字符串转成字符串拼接以及js代码，也就是字符串变成js代码，所以需要用`new Function`，尝试用前者实现一下

{%highlight javascript%}
var tplEng = function(tpl, data){
    var reg = /<%\s*([^%>]+?)\s*%>/g;
    var code = '"'+ tpl.replace(reg, function(all, param){
            return '"+'+param+'+"'
        })+'"';
  return (new Function(code))();
};
{%endhighlight%}

看代码好像组装完毕了，但是执行时肯定会报错，因为代码里引用的js变量未定义, 那我们可以将传入的data遍历并直出到构造函数的代码字符串中（变量声明），也就可以了。

{%highlight javascript%}
var tplEng = function(tpl, data){
    var reg = /<%\s*([^%>]+?)\s*%>/g;
    var attrs = [];
    var code = "";
    var attrs = [];
    for(var attr in data){
        attrs.push(attr + ' = ' + JSON.stringify(data[attr]));
    }
    if(attrs.length){
        dataClaim = 'var '+ attrs.join(',\n') +';'
    }

    code += dataClaim;
    code += 'return "'+ tpl.replace(reg, function(all, param){
            return '" + '+param+' + "'
        })+'";';
  return (new Function(code))();
};
{%endhighlight%}

其实这里实现已经提示出条件判断跟对象遍历了，实际上在讲模板转化成一个js代码字符串时，就是将属于js代码的部分原封不动的保留，将非代码部分构造成字符串拼接，最终执行这个js代码字符串。

模板：

{%highlight javascript%}
<ul>
<% for(i in post) { %>
  <li>
  <%name%>
  <%post[i]%>
  </li>
<% } %>
</ul>
{%endhighlight%}

转成函数代码：

{%highlight javascript%}
var r = [];
//这里开始跟模板的py关系
r.push('<ul>');
for (i in post){
    r.push("<li>");
    r.push(name);
    r.push(post[i]);
    r.push('</li>');
}
r.push('</ul>');
//py关系结束
return r.join('');
{%endhighlight%}

对比可以看出，可以利用正则，不断匹配模板内的`<%%>`，如果内容包含`for`等关键词，则原样输出，如果是变量则`r.push(变量)`,其他则都是直接`r.push(xxxx)`。

最终r组装成字符串，并用`Function`构造函数并执行。

我们来看胡子哥的实现：

{%highlight javascript%}
var tplEngine = function(tpl, data) {
    var reg = /<%([^%>]+)?%>/g, 
        regOut = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g, 
        code = 'var r=[];\n', 
        cursor = 0;

    var add = function(line, js) {
        js? (code += line.match(regOut) ? line + '\n' : 'r.push(' + line + ');\n') :
            (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
        return add;
    }
    while(match = reg.exec(tpl)) {
        add(tpl.slice(cursor, match.index))(match[1], true);
        cursor = match.index + match[0].length;
    }
    add(tpl.substr(cursor, tpl.length - cursor));
    code += 'return r.join("");';
    return new Function(code.replace(/[\r\t\n]/g, '')).apply(data);
};
{%endhighlight%}

这里最后用了`apply(data)`,将构建的function绑定this作用域，不过这样有个局限性，那就是模板内引用数据变量需要加上`this.`,不然同样是找不到对应的变量报错。

这里可以结合前面第一次拼装function字符串的实现，将传入的data一并进行`var`声明的内容拼装到字符串中。

{%highlight javascript%}
var tplEngine = function(tpl, data) {
    var reg = /<%\s*([^%>]+)?\s*%>/g, 
        regOut = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g, 
        code = 'var r=[];\n', 
        cursor = 0;
    if(toString.call(data)!=='[object Object]'){
        console.error('data is not plain Object');
        return;
    }
   
    var attrs = [];
    for(var attr in data){
        attrs.push(attr + ' = ' + JSON.stringify(data[attr]));
    }
    if(attrs.length){
        dataClaim = 'var '+ attrs.join(',\n') +';'
    }

    code += dataClaim;
    
    //三元运算符感觉可读性不大好
    var add = function(line, js) {
        js? (code += line.match(regOut) ? line + '\n' : 'r.push(' + line + ');\n') :
            (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
        return add;
    }
    while(match = reg.exec(tpl)) {
        add(tpl.slice(cursor, match.index))(match[1], true);
        cursor = match.index + match[0].length;
    }
    add(tpl.substr(cursor, tpl.length - cursor));
    code += 'return r.join("");';
    //console.log(code);
    return new Function(code.replace(/[\r\t\n]/g, '')).apply(data);
};

var t = '<% name %>,hello';

tplEngine(t, {name:"dont"});

var t1 = '<ul><%for(i in post){ %><li><%name%><%post[i]%></li><% } %></ul>';

tplEngine(t1,{name:'dont',post:{'name':'jim',age:26}});
{%endhighlight%}

这样就即可以模板引用变量用`this.`也可以不用了。

在实现这个数据声明构造时，踩过一个坑，那就是，一开始觉得直接`JSON.stringify`把data整一个都转成字符串，然后去掉最外层的尖括号，然后分割逗号变成数组，再把第一个冒号替换成等号，说个引号包裹单词去掉引号，最后组装回来。

{%highlight javascript%}
var dataClaim = JSON.stringify(data)
                    .replace(/^{|}$/g,'')
                    .split(',')
                    .map(function(e){
                            return e.replace(/:/,'=')
                            .replace(/"(\w+?)"/,'$1')
                    })
                    .join(',\n');
    if(dataClaim!==''){
        dataClaim = 'var '+ dataClaim +';'
    }
{%endhighlight%}

但这样遇到子对象内有逗号时分割就受到干扰了！

总结一下，模板引擎的思路就是，js函数的拼装以及构造函数和变量声明以及作用域绑定，貌似但凡涉及到字符串替换的，正则是少不了的，正则大法好，[个人的正则启蒙传送门](http://manual.phpv.net/regular_expression.htm)