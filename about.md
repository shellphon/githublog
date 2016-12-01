---
layout: page
title: 关于me
---

<p class="message">
  web前端开发，轻度漫画迷，会点ukulele，手游玩王者荣耀、火影忍者 <br>
  为什么喜欢前端？ - 因为所见即所得~
</p>

### 小东西

有时候有啥想法，就做点小东西出来玩玩~
<ul>
	 {% for link in site.data.my.funlinks%}
        <li>
             <a href="{{ link.url }}" target="_blank">{{ link.name }}</a>
        </li>
      {% endfor %}
</ul>

### SNS

对于博客，我主要写一些学习心得等内容，大部分从自己笔记中摘抄出来的，有什么不同看法欢迎交流！
<ul>
	 {% for link in site.data.my.snslinks%}
        <li>
             <a href="{{ link.url }}" target="_blank">{{ link.name }}</a>
        </li>
      {% endfor %}
</ul>

### 友链

这里有大神的干货博客，有熟人的技术博客~
<ul>
	 {% for link in site.data.my.friendlinks%}
        <li>
             <a href="{{ link.url }}" target="_blank">{{ link.name }}</a>
        </li>
      {% endfor %}
</ul>
