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

The site deploys on Netlify from `main`. `netlify.toml` holds the build settings, so every push to `main` publishes a new version. Pages are static HTML; only `/api/*` and `/admin` run as a Netlify Function.

## Where things live

| What | File |
| --- | --- |
| Agency name, tagline, email, socials, city | `src/data/site.ts` |
| Projects, case-study copy and card art | `src/data/projects.ts` |
| Colours, fonts and shared styles | `src/styles/global.css` |
| `<head>`, SEO meta and JSON-LD | `src/layouts/Base.astro` |
| Header, footer, CTA band, icons | `src/components/` |
| Pages | `src/pages/` (case studies come from `work/[slug].astro`) |
| Brief inbox: API, admin pages, storage and sign-in | `src/pages/api/`, `src/pages/admin/`, `src/lib/briefs.ts`, `src/lib/admin-auth.ts` |

Bracketed values such as `[X]`, `[CLIENT NAME]` and `[€ PRICE]` are placeholders carried over from the design. Search for `[` to find them all.

## Adding a project

Add an entry to `seeds` in `src/data/projects.ts`. It then shows up on Work (with a filter), Clients and llms.txt, and gets its own case study at `/work/<slug>`. To fill in the case study, replace the placeholder text in its `caseStudy`.

## Contact form and the brief inbox

The Contact form sends each brief to `/api/brief`. It is stored in Netlify Blobs (store `briefs`, built into Netlify, no extra service) and shows up in the admin panel.

- Open **`/admin`** on the live site and sign in with the admin password.
- Each brief shows the name, email, website, the services picked, when they want to start, and the message.
- Set a status (New, In progress, Done), filter by it, search, reply by email, delete, or download everything with **Export CSV**.

**Set the password once.** In Netlify go to Project configuration, then Environment variables, and add `ADMIN_PASSWORD` (at least 12 characters). Then trigger a redeploy. Until it is set, briefs are still collected and the panel shows a setup notice instead of the sign-in form. Changing the password signs every session out.

**Locally**, put `ADMIN_PASSWORD=...` in `.env` (gitignored) and run `npm run dev`. The dev server emulates Netlify, Blobs included.

Protections: server-side validation, a hidden spam trap, same-origin checks, at most 5 briefs per 10 minutes and 10 sign-in attempts per 15 minutes per connection (IPs are only stored hashed), an HttpOnly SameSite=Strict session cookie that lasts 7 days, and `/admin` and `/api` are excluded from search engines.

To send briefs somewhere else instead (Formspree, your own API), set `PUBLIC_CONTACT_ENDPOINT`.

## SEO

- `SITE_URL` sets canonical URLs, `sitemap-index.xml` and `robots.txt`. On Netlify it falls back to the site's own address, so it only needs setting elsewhere.
- Every page has a title, a meta description, Open Graph tags and Organization JSON-LD.
- Services adds FAQPage JSON-LD, and each case study adds Article JSON-LD.
- `/llms.txt` gives AI engines a plain-text map of the site.
- Placeholder case studies (`/work/client-*`) are `noindex` and left out of the sitemap.
