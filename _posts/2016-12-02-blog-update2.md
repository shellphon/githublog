---
layout: post
title:  博客改版啦2016
category: Hello Code
keywords: jekyll, github, responsible web
description: 
---

以前的博客样式，虽然简洁，但总给自己一种不像技术博客的感觉，通过[`hyde`](hyde.getpoole.com)和小猪的博客，我重新调整了一下博客的构造（样式、布局、css压缩）

### 布局

布局上，我选择两栏布局，看着清爽一些，再通过`hyde`的响应式处理，敲定了解决方案;

1.样式基本用`rem`,主要就分成两种情况，宽度够宽的18px,宽度小的就用16px；

{% highlight css %}
@media (min-width: 48em) {
  html {
    font-size: 16px;
  }
}
@media (min-width: 58em) {
  html {
    font-size: 18px;
  }
}
{% endhighlight %}

2.左右栏在窄屏下变为上下栏，这个也好做，其实也就是左边栏定位布局，窄屏时转为static（默认static），内容栏则`absolute`跟`static`切换

{% highlight css %}
.sidebar {
  text-align: center;
  padding: 2rem 1rem;
  color: rgba(255,255,255,.5);
  background-color: #202020;
}
@media (min-width: 48em) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 16.66rem;
    text-align: left;
  }
}
{% endhighlight %}


### jekyll配置

自从jekyll升到3.0，我都没咋去留意，`hyde`用了分页设置，但我觉得我原本的按分类设置也够用，就没打算用，不过提一下，3.0需要本地自己装`jekyll-paginate`才能支持分页.

我选择把首页改成标题+摘要的方式来平铺前几篇文章，用到了`page.excerpt`，挺好用的，貌似是会选取你文章开头的一段内容来当摘要。不过有个小问题，当你的文章开头用了`h1`等标签，在首页就比较难看了。以及`excerpt`似乎会把`p`标签也给加入进去，所以如果你想自己定制标签的话，建议这么引用`excerpt`.

~~~
{% raw %}
{{ post.excerpt | remove: '<p>' | remove: '</p>' }}
{% endraw %}
~~~

另外，我发现了`jekyll`可以设置数据配置，这样可以方便的将自己的一些数据写成配置文件，直接用`jekyll`语法读取即可.

可以在`_config.yml`设置，也可以建立`_data`目录，新建`myname.yml`,这样在模板里就可以直接用`site.data.myname`的方式得到配置文件里的数据对象。更详细内容可以到[这里](https://jekyllrb.com/docs/datafiles/)查看.

### css压缩

前阵子，给自己主页做了前端资源的压缩处理，用`gulp`构建，博客上改变最多的，估计也就样式，于是就弄了个gulp来构建。

在设置gulp压缩后输出时，想着开发文件跟正式文件应该有个命名区别，于是用了`gulp-rename`，直接用发现，会造成连目录也被多命名一份的情况，查找插件配置无果，发现`issue`有提到在`src`里做配置，于是就这么来处理了

{% highlight javascript %}
gulp.task('default',['css'],function(){
  return gulp.src('./tmp/**/*',{nodir:true})
    .pipe(rename({
      suffix:'-slv'
    })).pipe(gulp.dest('./'));
});
{% endhighlight %}

迁移花了不少时间，但也不算麻烦，接下来，写个node脚本做一下项目url测试吧~