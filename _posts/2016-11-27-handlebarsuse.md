---
layout: post
title:  handlebars的模板嵌入
category: Tool
keywords: handlebars, javascript, templateEngine
description: 
---

最近在思考怎么用handlebars做模板嵌入？

`handlebars`是一个基于js的模板引擎，作为普通的前端模板引擎，语法都差不多。

在`node`端，但模板引擎负责起页面模板渲染的时候，就有必要充分理解其功能，看是否能满足需求了。

`include`(模板嵌入) 应该算是后端模板一个很常见的功能了，我们往往需要把部分内容抽离出来以做复用，通过声明include的方式来达到渲染页面时 完整渲染整体。

在`freemarker`端，做过的项目里，其用的是自定义标签来实现。

代码如下：

页面A的ftl

{%highlight jsp%}
<@override name="block_head_static">
</@override>
<@override name="block_page_vars">
    <#assign title="收件地址" />
</@override>
<@override name="main">
    <@widget name="home:widget/address_list/address_list.ftl" />
</@override>
<@extends name="../../common/page/layout.ftl" />
{%endhighlight%}

layout 模板 原版太长，做一下简化

{%highlight jsp%}
<!DOCTYPE html>
<@block name="block_page_vars"></@block>
<@html framework="common:static/mod.js">
      <@head>
          <meta charset="utf-8" />
          <title>${title?default("")}</title>
      </@head>
      <@body>
            <div class="wrapper">
                  <div class="content" id="content">
                        <div class="cf main" id="main">
                              <@block name="main"></@block>
                        </div>
                  </div>
            </div>

      </@body>
</@html>
{%endhighlight%}

其原理是，得到A页面的ftl，识别出里面的extends标签，获得最底层的layout，然后通过其他`override`标签，做内容嵌入。


刚开始看`handlebars`，留意到了`partials`语法。

其基本使用，包含js和模板。

#### javascript

需要通过node端js做模板注册：`Handlebars.registerPartial`

~~~
Handlebars.registerPartial('myPartial', '{{name}}')
~~~

其中第一个参数为模板名称，第二个参数则是预编译的模板字符串

#### 模板部分

~~~
{%raw%}
{{> myPartial}}
{%endraw%}
~~~

这样就可以将注册了的模板字符串引入到目标模板中。

另外模板引入还有一个块写法：

~~~
{%raw%}
{{#> content-block}}
  Default content
{{/content-block}}
{%endraw%}
~~~

这里表示，如果content-block这个模板不存在的话，那么这里会直接拿里面的内容来渲染，即例子里的(Default content)


但仅仅只有这些，貌似没法跟freemarker那样灵活实现extends.

于是我们注意到，还有一个inline的语法：

~~~
{%raw%}
{{#*inline "content-block"}}
  My new content
{{/inline}}
{%endraw%}
~~~

其描述为：

> Templates may define block scoped partials via the inline decorator.

可以通过inline来定义模板块作用域内partials.

这个怎么理解呢？

举个例子：

现在有一个业务页面模板 lone.jsl

~~~
{%raw%}
{{#> layout title="test" }}
      <p>ddd</p>
  {{#*inline "main"}}
  <p>hello</p>
  {{/inline}}
{{/layout}}
{%endraw%}
~~~

可以看到，我们这里是引用了一个layout命名的模板，其内部使用了inline语法来声明这个模板里有一个main的内联块，内容是`<p>hello</p>`, 这里要区分一下`<p>ddd</p>`是在layout不存在的情况下，才会输出这个，而inline声明的块，是在layout里面定义了一个块，不局限于得layout不存在才有效。

所以利用了这一点，我们这么来写这个layout

~~~
{%raw%}
<!DOCTYPE html>
<html lang="en">
<head>
      <meta charset="UTF-8">
      <title>
            {{#if title}}
                  {{title}}
            {{else}}
                  test
            {{/if}}     
      </title>
      {{#> head}}
            {{!-- d --}}
      {{/head}}
</head>
<body>
      {{#> main}}
            {{!-- d --}}
      {{/main}}
</body>
</html>
{%endraw%}
~~~

重点看

~~~
{%raw%}
      {{#> main}}
            {{!-- d --}}
      {{/main}}
{%endraw%}
~~~

这是一个模板块引用，由于前面页面模板已经在layout的引用里声明了inline main，所以这里实际上在引擎解析时会把页面那部分inline的内容给嵌入进来，从而实现了extends的效果.

在freemarker的时候，有时候因为业务页面共用，需要区分layout，这个时候可能要利用变量判断，具体如下：

~~~
<@override name="block_head_static">
</@override>
<@override name="block_page_vars">
    <#assign title="收件地址" />
</@override>
<@override name="main">
    <@widget name="home:widget/address_list/address_list.ftl" />
</@override>
<#if type==2>
<@extends name="../../common/page/layout.ftl" />
<#else>
<@extends name="../../common/page/tlayout.ftl" />
</#if>
~~~

这种情况，在handlebars也可以实现：

~~~
{%raw%}
{{#if type}}
{{#> layout title="test" }}
      <p>ddd</p>
  {{#*inline "main"}}
  <p>hello</p>
  {{/inline}}
{{/layout}}
{{else}}
{{#> tlayout}}
      <p>ddd</p>{{> main}}
  {{#*inline "main"}}
  <p>hello2</p>
  {{/inline}}
{{/tlayout}}
{{/if}}
{%endraw%}
~~~

`handlebars`还有个好处是，当`partial`不存在的情况下，也可以有默认输出，换做`freemarker`一般是要报错的。

另外，在freemarker里偶尔会用到assign来给模板里加入变量定义赋值的设置，这点在handlebars也可以实现，只是方式不同：

~~~
{%raw%}
{{#> layout title="test" }}
  <p>比如在调用layout partial时，代入变量赋值的操作，将test字符串赋值给title变量</p>
{{/layout}}
{%endraw%}
~~~

参考： [https://cloudfour.com/thinks/the-hidden-power-of-handlebars-partials/](https://cloudfour.com/thinks/the-hidden-power-of-handlebars-partials/)




