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

const DAY_MS = 86_400_000;
/** Rate limit records older than this many days are deleted (the privacy policy promises two). */
const KEEP_DAYS = 2;
/** At most this many expired records are deleted per request, so cleanup never slows a request much. */
const PURGE_BATCH = 50;

const utcDay = (t: number) => new Date(t).toISOString().slice(0, 10);

/** Keyed hash of the IP: without the key (derived from ADMIN_PASSWORD) it cannot be reversed by guessing. */
async function ipKey(ip: string): Promise<string> {
  const raw = await crypto.subtle.digest('SHA-256', enc.encode(`rate-limit-v2:${ADMIN_PASSWORD ?? 'unset'}`));
  const key = await crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(ip))).slice(0, 32);
}

/**
 * Sliding-window limit per client IP. Records live under `<bucket>/<UTC day>/<keyed IP hash>`;
 * a window that started yesterday still counts, and older days are deleted as requests come in.
 * Returns false when the caller has used up `max` hits in `windowMs` (at most one day).
 */
export async function withinLimit(bucket: string, ip: string, max: number, windowMs: number): Promise<boolean> {
  const store = getStore({ name: 'rate-limits', consistency: 'strong' });
  const now = Date.now();
  const id = await ipKey(ip);
  const todayKey = `${bucket}/${utcDay(now)}/${id}`;
  const read = async (key: string) => ((await store.get(key, { type: 'json' })) as number[] | null) ?? [];
  const [yesterday, today] = await Promise.all([read(`${bucket}/${utcDay(now - DAY_MS)}/${id}`), read(todayKey)]);
  const recent = [...yesterday, ...today].filter((t) => now - t < windowMs);
  await purgeOldDays(store, bucket, now).catch((error: unknown) => console.error('[rate-limit] Cleanup failed.', error));
  if (recent.length >= max) return false;
  await store.setJSON(todayKey, [...today.filter((t) => now - t < windowMs), now]);
  return true;
}

async function purgeOldDays(store: ReturnType<typeof getStore>, bucket: string, now: number) {
  const oldest = utcDay(now - (KEEP_DAYS - 1) * DAY_MS);
  // Keys right under the bucket predate the day folders (and the keyed hash): always expired.
  const { blobs: legacy, directories } = await store.list({ prefix: `${bucket}/`, directories: true });
  const expired = [...legacy.map((blob) => blob.key)];
  for (const dir of directories) {
    if (expired.length >= PURGE_BATCH) break;
    if ((dir.split('/')[1] ?? '') >= oldest) continue;
    const { blobs } = await store.list({ prefix: dir.endsWith('/') ? dir : `${dir}/` });
    expired.push(...blobs.map((blob) => blob.key));
  }
  for (const key of expired.slice(0, PURGE_BATCH)) await store.delete(key);
}

/** Client IP for rate limiting; undefined when the platform does not expose it. */
export function clientIp(clientAddress: () => string): string {
  try {
    return clientAddress() || 'unknown';
  } catch {
    return 'unknown';
  }
}
