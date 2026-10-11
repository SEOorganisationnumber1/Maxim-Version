# Agency site

A static Astro site recreated from the "Agency Portfolio" design canvas. It has seven page types: Home, Work, Case study, Services, Clients, Company and Contact.

## Run it

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # type-checks, then writes static HTML to dist/
npm run preview    # serves dist/
```

## Deploy

The site deploys on Netlify from `main`. `netlify.toml` holds the build settings, so every push to `main` publishes a new version.

## Where things live

| What | File |
| --- | --- |
| Agency name, tagline, email, socials, city | `src/data/site.ts` |
| Projects, case-study copy and card art | `src/data/projects.ts` |
| Colours, fonts and shared styles | `src/styles/global.css` |
| `<head>`, SEO meta and JSON-LD | `src/layouts/Base.astro` |
| Header, footer, CTA band, icons | `src/components/` |
| Pages | `src/pages/` (case studies come from `work/[slug].astro`) |

Bracketed values such as `[X]`, `[CLIENT NAME]` and `[€ PRICE]` are placeholders carried over from the design. Search for `[` to find them all.

## Adding a project

Add an entry to `seeds` in `src/data/projects.ts`. It then shows up on Work (with a filter), Clients and llms.txt, and gets its own case study at `/work/<slug>`. To fill in the case study, replace the placeholder text in its `caseStudy`.

## Contact form

The form validates in the browser and POSTs JSON to `PUBLIC_CONTACT_ENDPOINT` (Formspree, Basin, your own API and so on). The JSON fields are `name`, `email`, `website`, `needs`, `timeline` and `message`. If the variable isn't set, the form runs in demo mode: it shows the success state but doesn't send anything. Copy `.env.example` to `.env` to set it.

## SEO

- `SITE_URL` sets canonical URLs, `sitemap-index.xml` and `robots.txt`. On Netlify it falls back to the site's own address, so it only needs setting elsewhere.
- Every page has a title, a meta description, Open Graph tags and Organization JSON-LD.
- Services adds FAQPage JSON-LD, and each case study adds Article JSON-LD.
- `/llms.txt` gives AI engines a plain-text map of the site.
- Placeholder case studies (`/work/client-*`) are `noindex` and left out of the sitemap.
