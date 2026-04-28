---
layout: page
title: Subscribe
name: subscribe
eyebrow: "Stay in the loop"
title_html: "Get in <em>touch</em>."
description: >
  Signal over noise — delivered to your inbox when it matters.
permalink: /subscribe/
show_hero: true
---

<div class="form">
  <form action="https://formsubmit.co/{{ site.brand.email }}" method="POST">
    <input type="hidden" name="_captcha"  value="false" />
    <input type="hidden" name="_subject"  value="New message — {{ site.title }}" />
    <input type="hidden" name="_next"     value="{{ '/' | absolute_url }}" />

    <input
      class="field"
      type="text"
      name="name"
      placeholder="Your name"
      required
      autocomplete="name"
    />

    <input
      class="field"
      type="email"
      name="email"
      placeholder="Your email"
      required
      autocomplete="email"
    />

    <textarea
      class="field"
      name="message"
      placeholder="Anything you'd like us to know (optional)"
      rows="5"
    ></textarea>

    <button class="btn-submit" type="submit">Subscribe →</button>
  </form>
</div>
