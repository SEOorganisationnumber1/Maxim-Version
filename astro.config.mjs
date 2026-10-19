// @ts-check
import { defineConfig, envField } from 'astro/config';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';
import placeholderGuard from './integrations/placeholder-guard.mjs';
import { fontsourceFonts } from './integrations/fontsource-fonts.mjs';

// Canonical URLs, the sitemap and robots.txt are built from this.
// SITE_URL wins if set; on Netlify, URL is the site's main address
// (the custom domain once one is added, else the .netlify.app one). Local builds fall back to the live site.
const SITE_URL = process.env.SITE_URL ?? process.env.URL ?? 'https://maxim-version.netlify.app';

/** `astro dev` injects styles inline for hot reload, which a hash-based CSP blocks: the CSP is for builds. */
const DEV = process.argv.includes('dev');

/** Pages that exist but are not for search engines. */
const NOT_IN_SITEMAP = [/^\/admin(\/|$)/, /^\/contact\/sent$/, /^\/404$/];

/**
 * Any built page that tells search engines not to index it stays out of the sitemap too, so a page
 * can opt out from its own code (the Clients page does while it has too few clients to show).
 */
const DIST = new URL('./dist/', import.meta.url);
/** @param {string} page */
function isNoindex(page) {
  const path = new URL(page).pathname;
  try {
    const html = readFileSync(new URL(path === '/' ? 'index.html' : `.${path}.html`, DIST), 'utf8');
    return html.includes('<meta name="robots" content="noindex');
  } catch {
    return false;
  }
}

export default defineConfig({
  site: SITE_URL,
  // Keep the whitespace between tags. Compressed output glues adjacent words
  // ("WorkServicesClients") for crawlers and AI engines that read raw HTML.
  compressHTML: false,
  // URLs have no trailing slash (/work, not /work/), matching every internal
  // link, the canonical tags and the sitemap. Pages build to work.html etc.
  trailingSlash: 'never',
  build: { format: 'file' },
  // Every page stays prerendered static HTML. Only the brief API and /admin opt into
  // on-demand rendering (export const prerender = false), served by a Netlify Function.
  // staticHeaders: the CSP of static pages is sent as an HTTP header (so frame-ancestors works),
  // not as a <meta> tag.
  // imageCDN: false: images are resized at build time into static files (/_astro), so they work on any
  // host and cost no Netlify image transformations.
  adapter: netlify({ staticHeaders: true, imageCDN: false }),
  security: {
    // Astro hashes every script and style it renders and lists the hashes here, so no inline
    // code runs unless the build produced it. Umami (analytics) is the only outside origin.
    csp: DEV ? false : {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self' data:",
        "connect-src 'self' https://gateway.umami.is",
        "manifest-src 'self'",
        "form-action 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        'upgrade-insecure-requests',
      ],
      scriptDirective: { resources: ["'self'", 'https://cloud.umami.is'] },
    },
  },
  // No Markdown on the site. Shiki, the default code highlighter, writes inline styles that the
  // CSP above would block, so code blocks (if any are ever added) stay plain.
  markdown: { syntaxHighlight: false },
  // Self-hosted fonts from the Fontsource packages, with metric-matched fallbacks: text set in the
  // fallback has the web font's proportions, so pages barely move when the font arrives. The
  // layouts render <Font /> for each variable and preload the latin files.
  fonts: [
    {
      provider: fontsourceFonts(),
      name: 'Outfit',
      cssVariable: '--font-display',
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['sans-serif'],
      options: { package: '@fontsource-variable/outfit' },
    },
    {
      provider: fontsourceFonts(),
      name: 'Manrope',
      cssVariable: '--font-body',
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['sans-serif'],
      options: { package: '@fontsource-variable/manrope' },
    },
    {
      provider: fontsourceFonts(),
      name: 'JetBrains Mono',
      cssVariable: '--font-mono',
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['monospace'],
      options: { package: '@fontsource/jetbrains-mono', css: '500.css' },
    },
  ],
  env: {
    schema: {
      // Password for /admin, set in Netlify (Project configuration > Environment variables).
      // A secret: read at runtime on the server, never bundled into client code.
      ADMIN_PASSWORD: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Email alert for each new brief, sent with Resend (src/lib/notify.ts).
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      /** Where alerts go; several addresses can be separated by commas. */
      BRIEF_NOTIFY_TO: envField.string({ context: 'server', access: 'secret', optional: true }),
      /** "Name <alerts@yourdomain.com>" once a domain is verified in Resend; Resend's shared sender until then. */
      BRIEF_NOTIFY_FROM: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Public values, written into the HTML at build time.
      /** Umami Cloud website ID: turns on cookie-free analytics. */
      UMAMI_WEBSITE_ID: envField.string({ context: 'server', access: 'public', optional: true }),
      /** Search Console and Bing Webmaster Tools HTML-tag verification codes (the content="..." value). */
      GOOGLE_SITE_VERIFICATION: envField.string({ context: 'server', access: 'public', optional: true }),
      BING_SITE_VERIFICATION: envField.string({ context: 'server', access: 'public', optional: true }),
    },
  },
  integrations: [
    sitemap({ filter: (page) => !NOT_IN_SITEMAP.some((re) => re.test(new URL(page).pathname)) && !isNoindex(page) }),
    placeholderGuard(),
  ],
});
