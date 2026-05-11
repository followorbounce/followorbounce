# Portfolio Page — Implementation Guide

## Files to add (copy exactly as-is)

```
_data/portfolio.yml              → _data/portfolio.yml
_includes/portfolio-card.html    → _includes/portfolio-card.html
pages/portfolio.md               → pages/portfolio.md
_sass/_portfolio.scss            → _sass/_portfolio.scss
assets/js/portfolio.js           → assets/js/portfolio.js
```

---

## 1. Add one import to _sass/main.scss

Open `_sass/main.scss` and add at the very end:

```scss
@import "portfolio";
```

---

## 2. Add portfolio.js to _layouts/default.html

Open `_layouts/default.html`. Find the line:

```html
<script src="{{ '/assets/js/main.js' | relative_url }}" defer></script>
```

Add below it (only loads on portfolio page):

```html
{% if page.permalink == '/work/' %}
<script src="{{ '/assets/js/portfolio.js' | relative_url }}" defer></script>
{% endif %}
```

---

## 3. Add Work to navigation in _config.yml

```yaml
navigation:
  - title: "About"
    url: "/about/"
  - title: "Technology"
    url: "/technology/"
  - title: "Literature"
    url: "/literature/"
  - title: "Contracts"
    url: "/contracts/"
    children:
      - title: "Digital Law"
        url: "/contracts/digital-law/"
      - title: "Open Source"
        url: "/contracts/open-source/"
      - title: "Platform Terms"
        url: "/contracts/platform-terms/"
  - title: "Work"           # ← ADD THIS
    url: "/work/"           # ← ADD THIS
  - title: "Brand"
    url: "/brand/"
  - title: "Subscribe ↗"
    url: "/subscribe/"
    action: true
```

---

## 4. Add project cover images

Place cover images in:
```
assets/images/portfolio/your-project.jpg
```

Recommended size: 1200 × 675px (16:9). JPEG or WebP.

---

## 5. Add your projects in _data/portfolio.yml

Each project entry:

```yaml
- title: "Project Name"
  category: web              # web | branding | identity | development | graphic
  tags: ["Tag One", "Tag Two", "Tag Three"]
  description: "One or two sentences describing the project and its outcome."
  cover: "/assets/images/portfolio/project-cover.jpg"
  url: "https://external-site.com"      # optional — opens in new tab
  case_study: "/work/project-name/"     # optional — internal link
  behance: "https://behance.net/..."    # optional
  dribbble: "https://dribbble.com/..."  # optional
  figma: "https://figma.com/..."        # optional
  featured: true                        # optional — shows in featured row
  year: "2025"
```

---

## 6. Update external profile links in pages/portfolio.md

Find the profiles section and replace the href values:

```html
<a class="pf-profile-card" href="https://behance.net/YOUR_HANDLE" ...>
<a class="pf-profile-card" href="https://dribbble.com/YOUR_HANDLE" ...>
<a class="pf-profile-card" href="https://figma.com/@YOUR_HANDLE" ...>
```

Remove any profile cards you don't use.

---

## Result

- Portfolio page: `followorbounce.com/work/`
- Filter works by category with no page reload
- Projects driven entirely from `_data/portfolio.yml` — no HTML changes needed to add new work
- All styles use existing CSS variables — zero visual inconsistency with the rest of the site
