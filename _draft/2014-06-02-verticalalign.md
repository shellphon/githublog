---
layout: post
title: vertical-algin 笔记
---

前阵子看了下如何让图文垂直居中的实现，遇到了`vertical-align`这么一个属性。
刚好看到了一篇英文的文章，顺手翻译加以记录。  

***  
#####文章入口[>>](http://phrogz.net/CSS/vertical-align/index.html)  

> “如何在特定区域垂直居中？”，接着可能又问用来 `vertical-align`怎么还是不行呢？   

#####`vertical-algin` 在表格中的应用  

在表格标签中，`vertical-align`总能达到使用者的实现效果，在比较按标准实现的浏览器，下面三种都能实现垂直居中:  

{% highlight css %}
<td valign="middle"> <!--不过最好别用这个属性 --> </td>
<td style="vertical-align:middle"> ... </td>
<div style="display:table-cell; vertical-align:middle"> ... </div>
{% endhighlight %}   

效果如下：  

<div id="tablecellexamples">
		<table><tbody><tr>
			<td valign="middle"><code>&lt;td&gt;</code> using <code>valign="middle"</code></td>
			<td valign="bottom"><code>&lt;td&gt;</code> using <code>valign="bottom"</code></td>
		</tr></tbody></table>
		<table><tbody><tr>
			<td style="vertical-align:middle"><code>&lt;td&gt;</code> using <code>vertical-align:middle</code></td>
			<td style="vertical-align:bottom"><code>&lt;td&gt;</code> using <code>vertical-align:bottom</code></td>
		</tr></tbody></table>
		<div style="display:table-row">
			<div style="display:table-cell; vertical-align:middle"><code>&lt;div&gt;</code> using <code>display:table-cell; vertical-align:middle</code></div>
			<div style="display:table-cell; vertical-align:bottom"><code>&lt;div&gt;</code> using <code>display:table-cell; vertical-align:bottom</code></div>
		</div>
	</div>

#####`vertical-algin`在内敛元素的应用

内敛元素用上该属性，怎么说呢，这是一个全新的ballgame. 在这种情况下效果如同在`<img>`元素上用  `align`。  
以下效果是一样的：  
{% highlight css %}
<img align="middle" ...>
<img style="vertical-align:middle" ...>
<span style="display:inline-block; vertical-align:middle"> foo<br>bar </span>
{% endhighlight %}

<div id="inlineexample">
		<p>In this paragraph, I have two images—<img src="align_middle.gif" align="middle" alt="align=&quot;middle&quot;"> and <img src="align_bottom.gif" align="bottom" alt="align=&quot;bottom&quot;">—as examples.</p>
		<p>In this paragraph, I have two images—<img src="verticalalign_middle.gif" style="vertical-align:middle" alt="style=&quot;vertical-align:middle&quot;"> and <img src="verticalalign_bottom.gif" style="vertical-align:text-bottom" alt="style=&quot;vertical-align:text-bottom&quot;">—as examples.</p>
		<p>In this paragraph, I have a cute little <code>&lt;span&gt;</code> <span style="display:inline-block; vertical-align:middle">display:inline-block<br>vertical-align:middle</span> and <span style="display:inline-block; vertical-align:text-bottom">display:inline-block<br>vertical-align:text-bottom</span> as an example.</p>
	</div>
 

