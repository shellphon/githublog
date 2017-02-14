---
layout: post
title:  vue使用示例集
category: Hellocode
keywords: vuejs2, vue-cli
description: 主要放一些用vue来实现的一些功能集合
---

最近博客内容都跟vue有关，但也不是那么深的东西，于是想着用一篇文章来做一个简单的示例合集，比如说抽奖的实现等等。最近弄了两个简单的抽奖，先放上来，后续有新的东西，再整理过来。鉴于demo用jsfiddle来演示了，代码都在上面，我就不贴代码了。

### 方块抽奖
<iframe width="100%" height="550" src="//jsfiddle.net/dont27/n37vtgev/embedded/result,js,html,css/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>
方块抽奖的一个原理是，定义好奖项，然后根据不停切换索引来控制索引对应的dom元素高亮的操作，在vue的数据驱动思维里，这个很好做，那就是把索引作为data数据，不停的变换data数据，从而达到模板更新。另外的逻辑在于变换数据的节奏上，如果匀速变化，就显得太假（可能我抽的是假奖）。那么就要控制一下速度了，可以设置变量来存储至少索引的变化次数，在这个次数递减过程中，递增timeout的时间，慢慢的延迟变换数据速度变慢了，到最后停在了奖项上，而奖品的索引则通过随机数生成。（当然可以自己设置，你懂的= =）

### 抽数字
<iframe width="100%" height="400" src="//jsfiddle.net/dont27/8u7map0p/embedded/result,js,html,css/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>
抽数字，规则从0-9999中随机抽出一个数。很简单的一个功能，实际实现也不难，大致的数据变化速度可以照搬方块抽奖的逻辑，而且生成数字的逻辑很简单。我觉得最好在于数字切换的实现上，我的做法是，每位数都用一个截断的父元素放置着，子元素则是一个竖着的0-9的数字排列，通过调整排列子元素的偏移位置，使得有一种数字纵向切换的感觉。

### 简易轮播

<iframe width="100%" height="300" src="//jsfiddle.net/dont27/Lmoj6uq0/6/embedded/result,js,html,css/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

轮播原理在于控制列表横线移动，设置相对定位，数据驱动主要为 索引值的变动，变动带动偏移值的变化，以及涉及其他比如定时变化索引值等，由于多个方法要用到定时，可以将定时句柄作为数据之一，以便重置。