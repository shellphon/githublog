---
layout: page
title: 所有文章
---
<div id="blog-posts">
  <hr />
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
<script>
(function(){
  var toggle = document.getElementsByClassName('to-toggle');
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