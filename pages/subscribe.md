---
layout: page
title: "Subscribe"
eyebrow: "Subscribe"
show_hero: false
description: "Subscribe to Follow or Bounce or get in touch with the editors."
permalink: /subscribe/
---

<div class="page-hero">
  <p class="eyebrow">Subscribe</p>
  <h1>Get in touch</h1>
</div>

<form class="form-block" action="https://formsubmit.co/followorbounce@gmail.com" method="POST">
  <input type="hidden" name="_captcha" value="false">
  <input type="hidden" name="_subject" value="New message — Follow or Bounce">

  <input
    class="form-block__field"
    type="text"
    name="name"
    placeholder="Your name"
    required
  >
  <input
    class="form-block__field"
    type="email"
    name="email"
    placeholder="Your email"
    required
  >
  <textarea
    class="form-block__field"
    name="message"
    placeholder="Your message (or just say hello)"
    rows="5"
    required
  ></textarea>
  <button class="form-block__submit" type="submit">Send →</button>
</form>
