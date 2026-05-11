# Brand + 404 Pages — Follow or Bounce

## Files to add to your Jekyll repo

```
pages/brand.md              → pages/brand.md
404.html                    → 404.html  (root, not in pages/)
_sass/_brand-and-404.scss   → _sass/_brand-and-404.scss
```

## One line to add in _sass/main.scss

At the very end of `_sass/main.scss`, add:

```scss
@import "brand-and-404";
```

## Add Brand to navigation in _config.yml

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
  - title: "Brand"
    url: "/brand/"
  - title: "Subscribe ↗"
    url: "/subscribe/"
    action: true
```

## Done.

- Brand page → followorbounce.com/brand/
- 404 page   → served automatically by GitHub Pages on any missing URL
