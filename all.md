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
    <table>
      <colgroup>
          <col class="post-col1">
          <col class="post-col2">
      </colgroup>
      <tbody>
    {% for post in category.last %}
    <tr>
        <td class="post-date">
          <span>{{ post.date | date: "%b %d, %Y" }}</span>
        </td>
        <td class="post-url">
          <a href="{{ site.baseurl }}{{ post.url }}">{{ post.title }}</a>
        </td>
    </tr>
    {% endfor %}
   </tbody>
   </table>
  {% endfor %}

</div>