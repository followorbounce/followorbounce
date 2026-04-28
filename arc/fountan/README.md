# The Fountain Group — Jekyll Site

## Architecture Overview

```
fountain-group/
│
├── _config.yml               ← Site-wide settings, title, URL, nav
│
├── _data/                    ← All content as structured YAML (edit here!)
│   ├── site.yml              ← Practice info, locations, fees, hours, stats
│   ├── doctors.yml           ← Dr. Prashanth & Dr. Ksenia full profiles
│   ├── services.yml          ← All 7 service categories with details
│   └── faq.yml               ← FAQ entries for Contact page
│
├── _layouts/                 ← Page templates
│   ├── default.html          ← Base: <head>, nav, footer, scripts
│   ├── page.html             ← Extends default + page-hero banner
│   └── doctor.html           ← Extends default + full doctor profile UI
│
├── _includes/                ← Reusable HTML fragments
│   ├── nav.html              ← Navigation bar (auto active state)
│   ├── footer.html           ← Footer with locations from _data/site.yml
│   └── doctor-card.html      ← Doctor card component (used on index + about)
│
├── assets/
│   ├── css/style.css         ← Original styles + Fountain Group additions
│   └── js/main.js            ← Original JS (nav, form, scroll reveal)
│
├── index.html                ← Homepage (hero, doctors, services, locations)
│
└── pages/
    ├── about.html            ← Practice page (stats, philosophy, fees)
    ├── services.html         ← Full services + pricing
    ├── contact.html          ← Contact details + FAQ from _data/faq.yml
    ├── booking.html          ← Booking form (auto-populates from ?doctor=)
    └── doctors/
        ├── prashanth.html    ← Dr. Prashanth profile (uses doctor layout)
        └── ksenia.html       ← Dr. Ksenia profile (uses doctor layout)
```

## Data Sources → Pages

| Data File         | Powers                              |
|-------------------|-------------------------------------|
| `_data/site.yml`  | All pages (contact, fees, locations, hours) |
| `_data/doctors.yml` | index.html, about.html (cards via include) |
| `_data/services.yml` | index.html (grid), services.html (full) |
| `_data/faq.yml`   | contact.html (accordion)           |

## To Update Content

**Change a phone number or email:** Edit `_data/site.yml` → `contact:` — it propagates everywhere.

**Add a location:** Add an entry to `_data/site.yml` → `locations:` — appears in footer, contact page, about page, booking form automatically.

**Update fees:** Edit `_data/site.yml` → `fees:` — propagates to about, services, and booking pages.

**Update a doctor's bio or specialties:** Edit `_data/doctors.yml` — the doctor cards and profile pages pull from this file.

**Add a FAQ:** Add an entry to `_data/faq.yml` — appears instantly on Contact page.

**Add a service:** Add an entry to `_data/services.yml` — appears on homepage and services page.

## To Run Locally

```bash
gem install bundler jekyll
bundle init
bundle add jekyll jekyll-seo-tag jekyll-sitemap
bundle exec jekyll serve
```

## Key Design Decisions

- **Style preserved exactly** from the original Meridian Mind design (Cormorant Garamond + DM Sans, green palette)
- **All dummy data replaced** with real Fountain Group data from emails
- **Data-driven**: changing one YAML file updates all pages — no HTML hunting
- **Doctor layout is generic**: adding a third doctor is one new page + one YAML entry
- **Jekyll Liquid loops** replace all hardcoded card repetition
