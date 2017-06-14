---
layout: page
title: 所有文章
---
<div id="blog-posts">
  <div class="search">
    <span class="show-all">全部</span>
    <input type="text" class="search-input" placeholder="搜一下更快~">
    <button class="search-btn"><svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg></button>
  </div>
  <hr />
   <div class="result-tab search-result">
      <div class="no-result"><p>木有结果~</p></div>
     {% for post in site.posts %}
        <div class="post-item item{{ forloop.index0 }}">
          <a target="_blank" href="{{ site.baseurl }}{{ post.url }}" class="post-link">
            <h3>{{ post.title }}</h3>
          </a>
            <p>{{ post.excerpt | remove: '<p>' | remove: '</p>' | strip_html | strip_newlines }}……&emsp;&emsp;</p>
        </div>
     {% endfor %}
   </div>
   <div class="result-tab post-result display-show">
    {% for category in site.categories reversed  %}
     <div class="cate-div">
       {%comment%}
       <span class="cate-title">{{ category | first | upcase}}</span><span class="cate-num">{{ category | last | size }}</span>
       {{category[0]}}
       {%endcomment%}
       {%for item in site.data.my.category %}
        {%if item[0] == category[0] %}
       <span class="cate-title">{{ item[1] }}</span><span class="cate-num">{{ category | last | size }}</span>
        {% endif %}
       {% endfor %}
     </div>
      <ul class="cate-posts{% if category.last.size > 5 %} more{%endif%}" id="posts_{{ category|first }}">
      {% for post in category.last %}
        <li>
            <span class="post-date">{{ post.date | date: "%b %d, %Y" }}</span>
            <div class="post-url">
              <a href="{{ site.baseurl }}{{ post.url }}">{{ post.title }}</a>
            </div>
        </li>
      {% endfor %}
      </ul>
      {% if category.last.size > 5 %}
      <a href="javascript:void(0);" class="to-toggle" data-size="{{ category | last | size }}" data-ul-id="posts_{{ category|first }}" data-all='0'>展开</a>
      {% endif %}
    {% endfor %}
   </div>
<script>
(function(){
  function arrayLikeFn(obj, api,fn){
    return [][api].call(obj, fn);
  }
  function removeClass(dom, className){
    var reg = new RegExp('\\b'+className+'\\b','g');
    dom.className = trim(dom.className.replace(reg, ''));
  }
  function addClass(dom, className){
    dom.className += ' '+ className;
  }
  function hasClass(dom, className){
    var reg = new RegExp('\\b'+className+'\\b','g');
    return reg.test(dom.className);
  }
  function show(dom){
    !hasClass(dom, 'display-show') && addClass(dom, 'display-show');
  }
  function hide(dom){
    removeClass(dom, 'display-show');
  }
  function toggleClass(dom, className){
    if(hasClass(dom, className)){
      removeClass(dom, className);
    }else{
      addClass(dom, className);
    }
  }

  function showTab(type){
    if(type=='search'){
        show(searchResult);
        hide(postResult);
    }else{
        show(postResult);
        hide(searchResult);
    }
  }

  function trim(str){
    return str?str.replace(/^\s*|\s*$/g,''):str;
  }
  // 查看更多 和 收起
  var toggle = document.getElementsByClassName('to-toggle');

  // 文章信息
  var posts = [{%for post in site.posts%}{
      id: {{forloop.index0}},
      title: '{{post.title}}',
      excerpt: '{{ post.excerpt | remove: '<p>' | remove: '</p>' | strip_html | strip_newlines}}'
    }{% if forloop.index != forloop.length %},{%endif%}
  {%endfor%}
  ];

  var searchResult = document.querySelector('.search-result'),
      postResult = document.querySelector('.post-result');
  var noResult = document.querySelector('.no-result');

  function searchPosts(keyword){
    var reg = new RegExp(keyword)
    return posts.filter(function(e){
      return reg.test(e.title) || reg.test(e.excerpt);
    });
  }
  function hideShowedItems(){
    var items = document.querySelectorAll('.post-item.display-show');
    arrayLikeFn(items, 'forEach', function(dom,i){
      hide(dom);
    });
  }

  function isFocus(dom){
    return dom == document.querySelector('input:focus');
  }

  var input = document.getElementsByClassName('search-input')[0];
  var searchBtn = document.getElementsByClassName('search-btn')[0];
  
  document.querySelector('.show-all').onclick = function(){
    showTab('post');
  };
  input.onblur = function(){
      if(!trim(input.value)){
        showTab('post');
      }
  };
  document.addEventListener('keyup',function(event){
    if(event.keyCode == 13 && isFocus(input)){
      searchBtn.click();
    }
  });
  searchBtn.onclick = function(){
    var value = trim(input.value);
    var result;
    if(!value){
      showTab('post');
      return;
    }
    showTab('search');
    result = searchPosts(value);
    hideShowedItems();
    hide(noResult);
    if(result && result.length>0){
      result.forEach(function(e,i){
        var dom = document.getElementsByClassName('item'+e.id)['0'];
        show(dom);
      });
    }else{
        show(noResult);
    }
  };
  [].forEach.call(toggle, function(e,i){  
    e.onclick = function(event){
      var e = event.target;
      var id = e.getAttribute('data-ul-id');
      var status = !!~~e.getAttribute('data-all');
      var size = ~~e.getAttribute('data-size')*15/10;
      var posts = document.getElementById(id);
      if(status){
        posts.style.height = '7.5em';
        e.setAttribute('data-all', 0);
        e.innerHTML = '展开更多';
      }else{
        posts.style.height = size+'em';
        e.setAttribute('data-all', 1);
        e.innerHTML = '收起内容';
      }
    };
  });
})();

</script>
</div>