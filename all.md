---
layout: page
title: 所有文章
---

<div id="blog-posts">
  <hr />
  {% for category in site.categories reversed  %}
   <div class="cate-div">
     <span class="cate-title">{{ category | first | upcase}}</span><span class="cate-num">{{ category | last | size }}</span>
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