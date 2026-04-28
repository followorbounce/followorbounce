# Follow or Bounce — Jekyll Site

A publication at the intersection of technology, literature, and the agreements that hold them together.

## Quick Start (Local Development)

```bash
# Install dependencies
bundle install

# Serve locally with live reload
bundle exec jekyll serve --livereload

# Build for production
bundle exec jekyll build
```

Visit `http://localhost:4000` after serving.

---

## GitHub Pages Deployment

### Option A — User/Org Page (`username.github.io`)

1. Create a repo named `username.github.io`
2. In `_config.yml`, set:
   ```yaml
   baseurl: ""
   url: "https://username.github.io"
   ```
3. Push to the `main` branch
4. GitHub Pages builds automatically

### Option B — Project Page (`username.github.io/repo-name`)

1. Create a repo with any name (e.g., `follow-or-bounce`)
2. In `_config.yml`, set:
   ```yaml
   baseurl: "/follow-or-bounce"
   url: "https://username.github.io"
   ```
3. Go to Settings → Pages → Source → Deploy from branch → `main`
4. Push and GitHub builds automatically

### Option C — Custom Domain

1. Add a `CNAME` file to the repo root containing your domain:
   ```
   followorbounce.com
   ```
2. In `_config.yml`:
   ```yaml
   baseurl: ""
   url: "https://followorbounce.com"
   ```
3. Configure DNS with your registrar per GitHub's instructions

---

## Project Structure

```
follow-or-bounce/
├── _config.yml              # Site config + navigation
├── _layouts/
│   ├── default.html         # Base HTML shell
│   ├── home.html            # Homepage layout
│   └── page.html            # Standard interior page
├── _includes/
│   ├── header.html          # Site header (wordmark + nav)
│   ├── navigation.html      # Main nav + dropdown logic
│   ├── submenu.html         # Reusable dropdown component
│   └── footer.html          # Site footer
├── _sass/
│   ├── _variables.scss      # Design tokens
│   ├── _base.scss           # Reset + CSS custom properties
│   ├── _typography.scss     # Shared type utilities
│   ├── main.scss            # SCSS manifest
│   ├── components/
│   │   ├── _header.scss
│   │   ├── _navigation.scss
│   │   ├── _footer.scss
│   │   ├── _cards.scss
│   │   ├── _forms.scss
│   │   └── _ai-chat.scss
│   └── pages/
│       ├── _home.scss
│       └── _page.scss
├── assets/
│   ├── css/main.scss        # Jekyll SCSS entry point
│   ├── js/
│   │   ├── nav.js           # Navigation behaviour
│   │   └── ai-chat.js       # AI chat widget
│   └── images/
│       └── favicon.svg
├── _pages/                  # Content pages (rendered to /page-name/)
│   ├── about.md
│   ├── technology.md
│   ├── literature.md
│   ├── contracts.md
│   ├── contracts-digital-law.md
│   ├── contracts-open-source.md
│   ├── contracts-platform-terms.md
│   └── subscribe.md
└── index.html               # Homepage
```

---

## Adding a New Page

1. Create `_pages/my-new-page.md`:

```yaml
---
layout: page
title: "My New Page"
eyebrow: "Section Label"
subtitle: "A brief subtitle for the hero area."
description: "SEO meta description."
permalink: /my-new-page/
---

Your Markdown content here.
```

2. Add it to `_config.yml` navigation:

```yaml
navigation:
  - title: "My New Page"
    url: "/my-new-page/"
```

That's it. The layout, header, footer, and styles apply automatically.

---

## Adding Page-Specific Styles

1. Create `_sass/pages/_my-new-page.scss`
2. Import it in `_sass/main.scss`:
   ```scss
   @import "pages/my-new-page";
   ```
3. Or scope to a single page via front matter:
   ```yaml
   page_css: my-page-styles
   ```
   Then create `assets/css/my-page-styles.scss` (with front matter `---`) importing only what that page needs.

---

## Adding Dropdown Submenus

In `_config.yml`, add a `children` key to any nav item:

```yaml
navigation:
  - title: "Section"
    url: "/section/"
    children:
      - title: "Sub-page One"
        url: "/section/sub-one/"
      - title: "Sub-page Two"
        url: "/section/sub-two/"
```

The `navigation.html` and `submenu.html` includes handle rendering automatically.

---

## AI Chat Widget

The AI chat widget (`ai-chat.js`) calls Google Gemini directly from the client.

⚠️ **Never commit a real API key to a public repo.**

For GitHub Pages (static only), options:
- Omit the key and disable the widget
- Use a backend proxy (Netlify Function, Cloudflare Worker, etc.) to keep the key server-side
- Use a restricted key scoped only to your domain in the Google Cloud Console

To disable the widget, simply remove the AI Chat HTML block from `index.html`.
