// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Canonical URLs, the sitemap and robots.txt are built from this.
// SITE_URL wins if set; on Netlify, URL is the site's main address
// (the custom domain once one is added, else the .netlify.app one).
const SITE_URL = process.env.SITE_URL ?? process.env.URL ?? 'https://www.youragency.com';

export default defineConfig({
  site: SITE_URL,
  // Keep the whitespace between tags. Compressed output glues adjacent words
  // ("WorkServicesClients") for crawlers and AI engines that read raw HTML.
  compressHTML: false,
  // URLs have no trailing slash (/work, not /work/), matching every internal
  // link, the canonical tags and the sitemap. Pages build to work.html etc.
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    // Case studies for the [CLIENT NAME] slots are placeholders: keep them out of the sitemap.
    sitemap({ filter: (page) => !/\/work\/client-\d+\/?$/.test(page) }),
  ],
});
