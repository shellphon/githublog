---
layout: post
title: js关闭当前页的小细节
category: Hellocode
keywords: window.close window.open chrome firefox
description: 原来js也可以做到关闭当前页，但有一定局限性
---

距离上一篇日志，已经快要两个月了，这大半年里其实也没啥写东西，只不过都写到工作组git去了，性质不变的是依然没有几个人看，尽管像是白用功，但起码我自己会看会用，这也是我给其他新手建议的一点，要多做笔记。这次想写的内容其实很少，接到一个需求是，有个页面是链接点击新开标签页打开，并且页面上要有一个关闭按钮，点击关闭能自动关闭当前页面。

起初，我是拒绝的，一般来说window.close貌似在我印象里，只有ie才会生效，其他浏览器，针对`window.close()`会考虑安全问题而关闭不了页面，然后隔天pm跟我说系统有个页面做到这个效果了，还在企业微信发链接我，我打开一看，唉，真的可以耶，里面看看页面源码，直接写在a标签的onclick属性里`window.opener=null; var t=window.open('', '_self', ''); t.close(); `,顿时觉得好骚啊，这样就可以关闭页面了啊！！！

### 如何关闭页面

实际上，这个页面主要是用了`window.close()`, 对于`close`方法，可以看[MDN描述](https://developer.mozilla.org/en-US/docs/Web/API/Window/close)，有了这个方法，我们就可以写点击事件通过js来关闭当前页。

### 遇到的问题

然而，当我把这段简易代码放到自己的页面时，不管怎么点，页面就是不关闭。 在console上，没有报错，只有警告：`Scripts may not close windows that were not opened by script.`

起初，没留意这句话的意思。

总以为是那段代码的其他处理有问题，直到在前司前端群里询问小伙伴，小易给我翻译了那句英文，其实那句英文也没啥深意：当页面不是通过脚本打开时，脚本可能关闭不了页面。

再翻回close的mdn描述里：This method is only allowed to be called for windows that were opened by a script using the window.open() method. 

也就是说要想通过window.close关闭当前页面，唯有当前页面是通过window.open打开时，才能关闭该页面。

### 疑问

通过试验，的确，当使用window.open打开页面时，该页面的window.close终于生效了。只是我奇怪的是，当页面是通过企业微信或者QQ对话的链接点击自动触发浏览器打开页面时，同样也能通过window.close关闭页面。我大概的猜测是，诸如此类打开页面，估计跟用了window.open有点类似？所以效果一致吧。

### 回顾

这篇没啥干货的文章，想想如果当初我先去mdn查一下对应的方法描述，估计也不至于花那么长时间懵逼。难道老了吗？然后忘了MDN，笑哭脸.jpg...
