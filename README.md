# Follow or Bounce

A publication at the intersection of technology, literature, and the agreements that hold them together.

**Live site:** [followorbounce.com](https://followorbounce.com)  
**Host:** GitHub Pages (custom domain via CNAME)  
**Stack:** Jekyll, GitHub Pages, Sass, vanilla JS

---

## Project Structure

```
followorbounce.com/
├── _config.yml             # Site config, navigation, metadata
├── _data/
│   └── portfolio.yml       # Portfolio project entries
├── _includes/
│   └── portfolio-card.html # Reusable portfolio card component
├── _layouts/
│   └── default.html        # Single shared layout for all pages
├── _sass/
│   ├── _brand-and-404.scss # Brand page + 404 page styles
│   └── _portfolio.scss     # Portfolio/work page styles
├── assets/
│   ├── css/
│   │   └── main.scss       # Main stylesheet (imports all partials)
│   ├── images/
│   │   └── portfolio/      # Portfolio cover images (add your own)
│   └── js/
│       ├── main.js         # Nav dropdowns, AI chat widget, contact forms
│       └── portfolio.js    # Portfolio filter by category
├── pages/
│   ├── about.md
│   ├── brand.md
│   ├── contracts.md
│   ├── contracts-digital-law.md
│   ├── contracts-open-source.md
│   ├── contracts-platform-terms.md
│   ├── literature.md
│   ├── portfolio.md        # Renders at /work/
│   ├── subscribe.md
│   └── technology.md
├── 404.html
├── index.html
├── CNAME                   # followorbounce.com
└── Gemfile
```

---

## Local Development

```bash
bundle install
bundle exec jekyll serve
```

Open [http://localhost:4000](http://localhost:4000)

---

## Adding Portfolio Projects

Edit `_data/portfolio.yml`. Each project supports:

| Field | Description |
|---|---|
| `title` | Display title (required) |
| `category` | `web`, `branding`, `identity`, `development`, or `graphic` (required) |
| `tags` | Array of short label strings |
| `description` | One or two sentences |
| `cover` | Image path, e.g. `/assets/images/portfolio/project.jpg` (1200×675px recommended) |
| `url` | External URL — opens in new tab |
| `case_study` | Internal path, e.g. `/work/project-name/` |
| `behance` | Behance project URL |
| `dribbble` | Dribbble shot URL |
| `figma` | Figma file share URL |
| `featured` | `true` to appear in Featured row |
| `year` | 4-digit year string |

---

## Contact Form

Forms use [FormSubmit](https://formsubmit.co) (no backend required).  
Update `data-email` in `index.html` and `pages/subscribe.md` to your actual email address.

---

## AI Chat Widget

The AI chat button connects to a Render.com proxy service.  
Update `PROXY_URL` in `assets/js/main.js` to point to your own proxy endpoint.

---

## CSS Architecture

All styles live in three files:

- `assets/css/main.scss` — global tokens, layout, typography, forms, AI widget, footer
- `_sass/_brand-and-404.scss` — brand identity page + 404 page
- `_sass/_portfolio.scss` — work/portfolio page

Both partials are imported at the bottom of `main.scss`.

---

## Known Fixes Applied (v2)

1. `_brand-and-404.scss` was never imported — added `@import` to `main.scss`
2. `.contact-form` class was used but never defined — added rule to `main.scss`
3. `.pf-hero` had double horizontal padding — changed `padding: 3rem` to `padding: 3rem 0`
4. `.page-hero` lacked `border-bottom` — added border + `padding-bottom` for consistent rhythm
5. `h1` margin inside `.page-hero` was not reset — added `margin-bottom: 0` inside `.page-hero`
6. `portfolio.js` had Liquid include code appended to it — separated into correct file
7. `_config.yml` url pointed to `github.io` instead of custom domain — corrected to `followorbounce.com`
8. Portfolio CTA link used absolute `/subscribe/` — updated to `relative_url` filter
9. `arc/` directory excluded from Jekyll build via `_config.yml`
