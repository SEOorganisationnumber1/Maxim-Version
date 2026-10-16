// Analytics (Umami) and the search engine verification tags, read from the Netlify environment.
// Server-only. These values often get pasted as whole snippets (the tracking <script>, the
// verification <meta>): the ID or code is taken out of them, and a value without one counts as unset.

import { BING_SITE_VERIFICATION, GOOGLE_SITE_VERIFICATION, UMAMI_WEBSITE_ID } from 'astro:env/server';

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** Umami website ID, from the ID itself or from the whole tracking script tag. */
export const umamiWebsiteId: string | null = UMAMI_WEBSITE_ID?.match(UUID)?.[0].toLowerCase() ?? null;

/** A verification code, from the code itself or from the whole <meta ... content="..."> tag. */
function verificationCode(raw: string | undefined): string | null {
  const value = raw?.trim() ?? '';
  const code = value.match(/content\s*=\s*["']([^"']*)["']/i)?.[1].trim() ?? value;
  return /^[\w-]+$/.test(code) ? code : null;
}

export const googleSiteVerification = verificationCode(GOOGLE_SITE_VERIFICATION);
export const bingSiteVerification = verificationCode(BING_SITE_VERIFICATION);
