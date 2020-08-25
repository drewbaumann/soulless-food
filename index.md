---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: default
---
{% for post in site.posts limit:3 %}
  <h1><a href="{{ site.baseurl }}{{ post.url }}">{{ post.title }}</a></h1>
  {{ post.excerpt }}
{% endfor %}
<h1>Recent Posts</h1>
{% for post in site.posts offset:3 limit:3 %}
  <li>
    <a href="{{ site.baseurl }}{{ post.url }}">{{ post.title }}</a>
  </li>
{% endfor %}
