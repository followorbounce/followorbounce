---
layout: default
title: Blog
name: blog
permalink: /blog/
---

<section class="page-hero">
  <p class="eyebrow">All Posts</p>
  <h1 class="page-hero__title">The <em>archive</em>.</h1>
</section>

<div class="post-list">
  {% for post in site.posts %}
  <a class="post-list__item" href="{{ post.url | relative_url }}">
    <time class="post-list__date" datetime="{{ post.date | date_to_xmlschema }}">
      {{ post.date | date: "%b %-d, %Y" }}
    </time>
    <div>
      <h2 class="post-list__title">{{ post.title }}</h2>
      {% if post.description %}
      <p class="post-list__excerpt">{{ post.description }}</p>
      {% endif %}
    </div>
  </a>
  {% endfor %}
</div>
