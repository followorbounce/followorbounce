# Follow or Bounce

## Local development

```bash
bundle install
bundle exec jekyll serve --livereload
# → http://localhost:4000
```

## Deploy to GitHub Pages

1. Edit `_config.yml`:
   - **Project page** (`username.github.io/repo`): set `baseurl: "/repo-name"`
   - **User page or custom domain**: leave `baseurl: ""`
2. Push to `main`
3. Settings → Pages → Source → Deploy from branch → `main`

## Add a page

Create `pages/my-page.md`:

```yaml
---
layout: default
title: "My Page"
permalink: /my-page/
---
Content here.
```

Add it to `navigation` in `_config.yml`:

```yaml
- title: "My Page"
  url: "/my-page/"
```

## Add a dropdown

```yaml
- title: "Section"
  url: "/section/"
  children:
    - title: "Sub Page"
      url: "/section/sub-page/"
```

## Project structure

```
├── _config.yml          # Site config + nav data
├── _layouts/
│   └── default.html     # The only layout — header, footer, nav all here
├── assets/
│   ├── css/main.scss    # All styles
│   └── js/main.js       # Nav dropdowns + AI chat
├── pages/               # Content pages
│   ├── about.md
│   ├── technology.md
│   ├── literature.md
│   ├── contracts.md
│   ├── contracts-digital-law.md
│   ├── contracts-open-source.md
│   ├── contracts-platform-terms.md
│   └── subscribe.md
└── index.html           # Homepage
```
