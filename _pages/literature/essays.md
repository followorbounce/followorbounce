---
layout: page
title: Essays
name: literature
eyebrow: "Literature / Essays"
title_html: "Ideas in<br><em>long form</em>."
description: >
  Original long-form writing from the Follow or Bounce
  team and contributors.
permalink: /literature/essays/
---

{% assign essays = site.posts | where: "categories", "literature" %}
{% if essays.size > 0 %}
<div class="post-list">
  {% for post in essays %}
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
{% else %}
<p class="eyebrow eyebrow--spaced">No essays yet — check back soon.</p>
{% endif %}
