// Admin sign-in: one shared password (ADMIN_PASSWORD, set in Netlify), a signed session
// cookie, same-origin checks for state changes, and a small per-IP rate limiter.
// Server-only.

import type { AstroCookies } from 'astro';
import { getStore } from '@netlify/blobs';
import { ADMIN_PASSWORD } from 'astro:env/server';

export const SESSION_COOKIE = 'admin_session';
const SESSION_DAYS = 7;

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Constant-time comparison of two strings. */
function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const sha256 = async (s: string) => b64url(await crypto.subtle.digest('SHA-256', enc.encode(s)));

/** The session key is derived from the password, so changing the password signs everyone out. */
async function sessionKey(password: string) {
  const raw = await crypto.subtle.digest('SHA-256', enc.encode(`admin-session-v1:${password}`));
  return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}
const sign = async (password: string, payload: string) =>
  b64url(await crypto.subtle.sign('HMAC', await sessionKey(password), enc.encode(payload)));

/** True once ADMIN_PASSWORD is set (at least 12 characters). */
export const adminConfigured = () => typeof ADMIN_PASSWORD === 'string' && ADMIN_PASSWORD.length >= 12;

export async function passwordMatches(candidate: string): Promise<boolean> {
  if (!adminConfigured()) return false;
  return sameText(await sha256(candidate), await sha256(ADMIN_PASSWORD!));
}

export async function startSession(cookies: AstroCookies) {
  const exp = Date.now() + SESSION_DAYS * 86_400_000;
  const token = `${exp}.${await sign(ADMIN_PASSWORD!, `admin:${exp}`)}`;
  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_DAYS * 86_400,
  });
}

export function endSession(cookies: AstroCookies) {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

export async function isSignedIn(cookies: AstroCookies): Promise<boolean> {
  if (!adminConfigured()) return false;
  const token = cookies.get(SESSION_COOKIE)?.value ?? '';
  const [exp, sig] = token.split('.');
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  return sameText(sig, await sign(ADMIN_PASSWORD!, `admin:${exp}`));
}

/**
 * State changes must come from this site's own pages. Browsers send Origin on POST
 * (and Sec-Fetch-Site); together with the SameSite=Strict cookie this blocks CSRF.
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (origin) return origin === new URL(request.url).origin;
  return request.headers.get('sec-fetch-site') === 'same-origin';
}

/** Headers for every admin response: never cached, never indexed. */
export const ADMIN_HEADERS = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } as const;

/**
 * Sliding-window limit per client IP (hashed, never stored in clear).
 * Returns false when the caller has used up `max` hits in `windowMs`.
 */
export async function withinLimit(bucket: string, ip: string, max: number, windowMs: number): Promise<boolean> {
  const store = getStore({ name: 'rate-limits', consistency: 'strong' });
  const key = `${bucket}/${await sha256(`rl-v1:${ip}`)}`;
  const now = Date.now();
  const hits = (((await store.get(key, { type: 'json' })) as number[] | null) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) return false;
  hits.push(now);
  await store.setJSON(key, hits);
  return true;
}

/** Client IP for rate limiting; undefined when the platform does not expose it. */
export function clientIp(clientAddress: () => string): string {
  try {
    return clientAddress() || 'unknown';
  } catch {
    return 'unknown';
  }
}
