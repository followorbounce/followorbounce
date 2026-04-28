# Follow or Bounce — Jekyll Project

A production-grade Jekyll static site for the *Follow or Bounce* publication.

---

## Quick Start

```bash
# Install Ruby dependencies
bundle install

# Serve locally with live reload
bundle exec jekyll serve --livereload

# Production build
JEKYLL_ENV=production bundle exec jekyll build
```

Output lands in `_site/`. Deploy that directory to any static host.
The included GitHub Actions workflow handles deployment automatically.

---

## Project Structure

```
follow-or-bounce/
├── _config.yml                   ← Site config, brand vars, plugins
├── Gemfile
├── .gitignore
├── 404.html                      ← Custom "bounced" error page
├── README.md
│
├── .github/workflows/
│   └── deploy.yml                ← GitHub Actions → GitHub Pages CI/CD
│
├── _data/
│   └── navigation.yml            ← ALL nav items & submenus (single source of truth)
│
├── _layouts/
│   ├── default.html              ← HTML shell + opt-in features (ai_widget, page_css…)
│   ├── page.html                 ← Hero + prose content wrapper
│   └── post.html                 ← Full blog article with schema.org
│
├── _includes/
│   ├── header.html               ← Fixed header: wordmark + desktop nav + hamburger
│   ├── nav.html                  ← Desktop menu bar (data-driven, auto active-state)
│   ├── nav-mobile.html           ← Off-canvas mobile nav panel
│   ├── submenu.html              ← Reusable CSS-only dropdown (zero JS required)
│   ├── footer.html
│   ├── post-nav.html             ← Prev / next post links
│   └── ai-widget.html            ← Opt-in AI chat modal (aria-complete)
│
├── _sass/
│   ├── main.scss                 ← Entry point: @import in dependency order
│   ├── base/
│   │   ├── _tokens.scss          ← Sass $vars + CSS custom props (single source)
│   │   ├── _reset.scss
│   │   ├── _elements.scss
│   │   ├── _typography.scss      ← .eyebrow, .prose utilities
│   │   └── _layout.scss          ← .site-main, .page-wrapper
│   ├── components/
│   │   ├── _header.scss
│   │   ├── _nav.scss             ← Desktop menu bar + fill-sweep hover
│   │   ├── _submenu.scss         ← Dropdown panel
│   │   ├── _mobile-nav.scss      ← Hamburger + off-canvas panel
│   │   ├── _footer.scss
│   │   ├── _hero.scss
│   │   ├── _cards.scss
│   │   ├── _forms.scss
│   │   ├── _post.scss            ← Full post + inline prose styles
│   │   ├── _post-nav.scss
│   │   └── _ai-widget.scss
│   └── pages/                   ← Scoped overrides via body.page--{name}
│       ├── _home.scss
│       ├── _about.scss
│       ├── _technology.scss
│       ├── _literature.scss
│       ├── _contracts.scss
│       ├── _blog.scss
│       └── _subscribe.scss
│
├── assets/
│   ├── css/                      ← main.css compiled here at build time
│   ├── js/
│   │   ├── nav.js                ← Scroll sync, keyboard a11y, hamburger
│   │   └── ai-widget.js          ← AI chat modal logic (opt-in)
│   └── images/
│
├── _pages/                       ← Content pages
│   ├── about.md
│   ├── technology.md
│   ├── technology/
│   │   └── software.md           ← Submenu child page example
│   ├── literature.md
│   ├── literature/
│   │   └── essays.md             ← Submenu child page with post filtering
│   ├── contracts.md
│   ├── blog.md
│   └── subscribe.md
│
├── _posts/                       ← Blog posts (YYYY-MM-DD-slug.md)
│   ├── 2026-04-20-return-of-the-static-web.md     (category: technology)
│   └── 2026-04-15-reading-in-the-age-of-feeds.md  (category: literature)
│
└── index.html                    ← Homepage: hero + cards + subscribe form
```

---

## Adding a New Page (4 steps)

### 1. Create `_pages/mypage.md`

```yaml
---
layout: page
title: My Page
name: mypage          # sets body class .page--mypage
eyebrow: "Section label"
title_html: "A title with <em>emphasis</em>."
description: One-line description for the hero.
permalink: /mypage/
---

Markdown content here.
```

### 2. Add to `_data/navigation.yml`

```yaml
- title: My Page
  url: /mypage/
  id: mypage
  children:                 # optional — omit if no submenu needed
    - title: Sub-section
      url: /mypage/sub/
```

### 3. Create `_sass/pages/_mypage.scss`

```scss
.page--mypage {
  // Scoped styles that only apply to this page
  .my-component { ... }
}
```

### 4. Import in `_sass/main.scss`

```scss
@import 'pages/mypage';
```

Done. No other files need touching.

---

## Front-Matter Feature Flags

| Key           | Type    | Default | Effect                                        |
|---------------|---------|---------|-----------------------------------------------|
| `layout`      | string  | —       | `default`, `page`, or `post`                  |
| `name`        | string  | —       | Sets `body.page--{name}` for SCSS scoping     |
| `title_html`  | string  | —       | Raw HTML title with `<em>` support            |
| `eyebrow`     | string  | —       | Small label above the hero title              |
| `show_hero`   | boolean | `true`  | Set `false` to suppress the hero section      |
| `body_class`  | string  | —       | Extra class added to `<body>`                 |
| `page_css`    | string  | —       | Path to an additional CSS file (page-only)    |
| `page_js`     | string  | —       | Path to an additional JS file (page-only)     |
| `ai_widget`   | boolean | `false` | Show floating AI chat button                  |
| `sitemap`     | boolean | `true`  | Set `false` to exclude from sitemap           |

---

## Navigation & Submenus

All nav items live in `_data/navigation.yml`.

- **No submenu:** add an item without `children`.
- **With submenu:** add `children` — CSS-only hover reveal, keyboard-accessible via JS.
- **Mobile:** all items automatically appear in the off-canvas hamburger menu.
- **Active state:** set automatically by comparing `page.url` to item URLs.

---

## Deployment

### GitHub Pages (automatic)

1. Push this repo to GitHub.
2. Go to **Settings → Pages → Source** and select **GitHub Actions**.
3. Every push to `main` triggers `.github/workflows/deploy.yml` and deploys to
   `https://{username}.github.io/{repo}/`.

### Other hosts (Netlify, Cloudflare Pages)

```toml
# netlify.toml
[build]
  command   = "bundle exec jekyll build"
  publish   = "_site"

[build.environment]
  JEKYLL_ENV = "production"
  RUBY_VERSION = "3.2"
```
