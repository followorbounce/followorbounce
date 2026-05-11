---
layout: default
title: "Work"
description: "Portfolio of web design, brand identity, and visual design work by Follow or Bounce."
permalink: /work/
---

<div class="pf-page">

  <!-- ── HERO ──────────────────────────────────────────────────────────── -->
  <section class="pf-hero">
    <div class="pf-hero__label">
      <span class="eyebrow">Selected Work</span>
      <span class="pf-hero__count">
        {{ site.data.portfolio | size }} projects
      </span>
    </div>

    <h1 class="pf-hero__headline">
      Work that<br>
      <em>earns its place.</em>
    </h1>

    <p class="pf-hero__sub">
      Web design, brand identity, editorial systems, and digital experiences.
      Each project built to solve a specific problem — no decoration for its own sake.
    </p>
  </section>

  <!-- ── FILTER BAR ────────────────────────────────────────────────────── -->
  <div class="pf-filter" role="group" aria-label="Filter by category">
    <button class="pf-filter__btn is-active" data-filter="all">All</button>
    <button class="pf-filter__btn" data-filter="web">Web Design</button>
    <button class="pf-filter__btn" data-filter="branding">Branding</button>
    <button class="pf-filter__btn" data-filter="identity">Identity</button>
    <button class="pf-filter__btn" data-filter="development">Development</button>
    <button class="pf-filter__btn" data-filter="graphic">Graphic</button>
  </div>

  <!-- ── FEATURED PROJECTS ─────────────────────────────────────────────── -->
  {% assign featured = site.data.portfolio | where: "featured", true %}
  {% if featured.size > 0 %}
  <section class="pf-featured" aria-label="Featured projects">
    <div class="pf-section-label">
      <span class="pf-section-label__text">Featured</span>
    </div>
    <div class="pf-featured__grid">
      {% for project in featured %}
        {% include portfolio-card.html project=project %}
      {% endfor %}
    </div>
  </section>
  {% endif %}

  <!-- ── ALL PROJECTS GRID ─────────────────────────────────────────────── -->
  <section class="pf-grid-section" aria-label="All projects">
    <div class="pf-section-label">
      <span class="pf-section-label__text">All Projects</span>
    </div>
    <div class="pf-grid" id="portfolio-grid">
      {% for project in site.data.portfolio %}
        {% include portfolio-card.html project=project %}
      {% endfor %}
    </div>
  </section>

  <!-- ── EMPTY STATE (shown by JS when filter has no results) ──────────── -->
  <div class="pf-empty" id="portfolio-empty" style="display:none" aria-live="polite">
    <span class="pf-empty__icon">—</span>
    <p class="pf-empty__text">No projects in this category yet.</p>
  </div>

  <!-- ── EXTERNAL PROFILES ─────────────────────────────────────────────── -->
  <!-- <section class="pf-profiles">
    <div class="pf-section-label">
      <span class="pf-section-label__text">Find me on</span>
    </div>
    <div class="pf-profiles__grid"> 

      <!-- Edit or remove any of these links -->
    <!--  <a class="pf-profile-card" href="https://behance.net" target="_blank" rel="noopener">
        <span class="pf-profile-card__name">Behance</span>
        <span class="pf-profile-card__desc">Full project case studies</span>
        <span class="pf-profile-card__arrow">↗</span>
      </a> 

    <!--  <a class="pf-profile-card" href="https://dribbble.com" target="_blank" rel="noopener">
        <span class="pf-profile-card__name">Dribbble</span>
        <span class="pf-profile-card__desc">UI shots and explorations</span>
        <span class="pf-profile-card__arrow">↗</span>
      </a>

    <!--  <a class="pf-profile-card" href="https://figma.com" target="_blank" rel="noopener">
        <span class="pf-profile-card__name">Figma</span>
        <span class="pf-profile-card__desc">Live design files</span>
        <span class="pf-profile-card__arrow">↗</span>
      </a>

    </div> -->
  </section>

  <!-- ── CTA ───────────────────────────────────────────────────────────── -->
  <section class="pf-cta">
    <div class="pf-cta__inner">
      <p class="eyebrow">Start a project</p>
      <h2 class="pf-cta__headline">Have something in mind?</h2>
      <a class="pf-cta__btn" href="/subscribe/">Get in touch →</a>
    </div>
  </section>

</div>
