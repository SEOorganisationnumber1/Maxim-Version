// Analytics (Umami) and the search engine verification tags, read from the Netlify environment.
// Server-only. These values often get pasted as whole snippets (the tracking <script>, the
// verification <meta>): the ID or code is taken out of them, and a value without one counts as unset.

import { BING_SITE_VERIFICATION, BOOKING_URL, GOOGLE_SITE_VERIFICATION, UMAMI_WEBSITE_ID } from 'astro:env/server';

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

/**
 * The scheduling page visitors book a call on, from the link itself or from a pasted snippet that
 * contains it. Only https links count. Without one, Contact asks when suits the visitor instead.
 */
export const bookingUrl: string | null = (() => {
  const raw = BOOKING_URL?.match(/https:\/\/[^\s"'<>]+/)?.[0];
  if (!raw) return null;
  try {
    return new URL(raw).href;
  } catch {
    return null;
  }
})();

/**
 * "username/event" when the booking page is on Cal.com: the calendar is then embedded in the
 * Book a call dialog and on /contact. Any other booking page (Calendly...) opens in a new tab.
 */
export const calLink: string | null = (() => {
  if (!bookingUrl) return null;
  const url = new URL(bookingUrl);
  if (url.hostname !== 'cal.com' && url.hostname !== 'app.cal.com') return null;
  const path = url.pathname.replace(/^\/+|\/+$/g, '');
  return /^[\w.-]+(\/[\w.-]+)*$/.test(path) ? path : null;
})();
