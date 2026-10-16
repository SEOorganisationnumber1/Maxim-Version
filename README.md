# Launchery Studio website

The site of Launchery Studio, a product studio that designs, builds, launches and grows websites, web apps, SaaS and AI products. It is an Astro build of the "Agency Portfolio" design canvas: Home, Work, Case study, Services, Clients, Company, Contact and Privacy. Pages are static HTML; only the brief API and `/admin` run as a Netlify Function.

The brand name, tagline and service list live in `src/data/site.ts`; every page, share image, JSON-LD block, the admin panel and the brief emails read them from there.

## Run it

```bash
npm install
npm run dev        # http://localhost:4321, emulates Netlify (Blobs included)
npm run build      # type-checks, then writes the site to dist/
```

`npm run build` fails if a bracketed placeholder such as `[X]` would reach a page (see Content below).

## Deploy

The site deploys on Netlify from `main`: every push to `main` publishes a new version. `netlify.toml` holds the build settings and the security headers.

### Before launch

In Netlify, under Project configuration > Environment variables (then trigger a redeploy):

| Variable | What it does |
| --- | --- |
| `ADMIN_PASSWORD` | Password for `/admin`, at least 12 characters. |
| `RESEND_API_KEY`, `BRIEF_NOTIFY_TO` | An email for every new brief. Create a free [Resend](https://resend.com) account and an API key. Until you verify a domain in Resend, `BRIEF_NOTIFY_TO` must be the address you signed up with. |
| `BRIEF_NOTIFY_FROM` | Optional sender, e.g. `Briefs <briefs@yourdomain.com>`, once the domain is verified in Resend. |
| `UMAMI_WEBSITE_ID` | Turns on cookie-free analytics ([Umami Cloud](https://umami.is)). No cookie banner is needed. The website ID, or the whole tracking `<script>` tag Umami shows. |
| `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION` | The HTML-tag verification for Search Console and Bing Webmaster Tools: its `content` value, or the whole `<meta>` tag. |

Also in Netlify:

- Project configuration > General > **Powered by Netlify badge**: switch it off.
- Domain management: add the custom domain. Canonical URLs, the sitemap and the share images follow it automatically.

The privacy policy names only the services that are configured, so it updates itself when these variables are set. Before launch, have someone review it against your business and fill in `legal` in `src/data/site.ts`.

## Content: nothing half-finished ships

Everything that still needs real data lives in two files. A value left `null` (or an empty list) hides the line or section that needs it; set it and the section appears on the next deploy.

| What | Where | Hidden until set |
| --- | --- | --- |
| Public email, social profiles, city, reply time | `site` in `src/data/site.ts` | "Prefer email?" lines, footer contacts, JSON-LD email and sameAs |
| Company name, registration, address | `legal` in `src/data/site.ts` | Privacy policy names the agency until then |
| Numbers (projects, years, markets, retention, founded, team size) | `numbers` in `src/data/site.ts` | Number bands on Home and Company |
| Plan prices | `prices` in `src/data/site.ts` | Plans read "Custom quote" |
| Client quotes, team | `testimonials`, `team` in `src/data/site.ts` | Quotes on Clients, team on Company |
| Projects, summaries, case studies | `seeds` in `src/data/projects.ts` | A project without `caseStudy` has no page and its cards do not link |

Only real clients and real quotes go in: the site shows them as proof. The build stops with a list of pages if bracketed text such as `[X]`, `[CLIENT NAME]` or `[hello@youragency.com]` would ship (`integrations/placeholder-guard.mjs`).

### Adding a project or a case study

Add an entry to `seeds` in `src/data/projects.ts`. It appears on Home, Work, Clients and in `llms.txt`. Add `summary` for the card line, and `caseStudy` (its shape is the `CaseStudy` type in the same file) to publish `/work/<slug>` with its own share image and Article JSON-LD. The Work filters appear once there are two projects.

## Where things live

| What | File |
| --- | --- |
| Agency facts and content still to come | `src/data/site.ts` |
| Projects and case studies | `src/data/projects.ts` |
| Share image titles (one per page) | `src/data/og.ts` |
| Colours and shared styles | `src/styles/global.css` |
| Fonts (self-hosted from the Fontsource packages) | `fonts` in `astro.config.mjs`, `integrations/fontsource-fonts.mjs` |
| `<head>`, SEO meta, JSON-LD, analytics | `src/layouts/Base.astro`; the Umami ID and verification codes are cleaned up in `src/lib/integrations.ts` |
| Header with the mobile menu, footer, CTA band, icons | `src/components/` |
| Pages | `src/pages/` (case studies come from `work/[slug].astro`) |
| Share images, favicon, app icons, manifest | `src/pages/og/[card].png.ts`, `favicon.ico.ts`, `apple-touch-icon.png.ts`, `icon-[size].png.ts`, `site.webmanifest.ts`, drawn by `src/lib/og.ts` |
| Brief inbox: API, email alert, admin, storage, sign-in | `src/pages/api/`, `src/lib/notify.ts`, `src/pages/admin/`, `src/lib/briefs.ts`, `src/lib/admin-auth.ts` |
| Security headers | `netlify.toml` (static files), `src/middleware.ts` (functions), CSP in `astro.config.mjs` |

## Contact form and the brief inbox

The Contact form sends each brief to `/api/brief`. It is stored in Netlify Blobs (store `briefs`) and, once Resend is set up, an email arrives with the brief; replying to it answers the sender. A failed email never loses a brief.

The form also works without JavaScript: the browser checks the required fields, posts the form, and lands on `/contact/sent`.

- Open **`/admin`** on the live site and sign in with the admin password.
- Each brief shows the name, email, website, the services picked, when they want to start, and the message.
- Set a status (New, In progress, Done), filter by it, search, reply by email, delete, or download everything with **Export CSV**.

The privacy policy promises that briefs without a follow-up are deleted within 12 months of the last exchange: delete old ones in `/admin`.

Protections: server-side validation, a hidden spam trap, same-origin checks, at most 5 briefs per 10 minutes and 10 sign-in attempts per 15 minutes per connection, an HttpOnly SameSite=Strict session cookie that lasts 7 days, and `/admin` and `/api` are kept out of search engines. Rate limiting stores IP addresses only as a keyed hash, and those records are deleted after two days.

## Security

- A Content Security Policy built by Astro from hashes of every script and style it renders (`security.csp` in `astro.config.mjs`), sent as a header. Umami is the only outside origin. The CSP is off under `npm run dev`, where styles are injected inline.
- `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and `Cross-Origin-Opener-Policy` on every response.
- `npm audit` reports issues only in the Netlify adapter's local dev tooling (`@netlify/dev`), which is not part of the deployed site.

## SEO

- `SITE_URL` (or Netlify's `URL`) sets canonical URLs, `sitemap-index.xml`, `robots.txt` and share image addresses.
- Every page has a title, a description, Open Graph and Twitter tags with its own 1200 x 630 share image, and Organization JSON-LD. Home adds WebSite; Services adds FAQPage; case studies add Article and BreadcrumbList.
- `/llms.txt` gives AI engines a plain-text map of the site.
- `/admin`, `/contact/sent` and the 404 page stay out of the sitemap.
