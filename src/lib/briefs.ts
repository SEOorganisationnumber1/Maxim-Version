// Briefs sent from the Contact form: validation, storage (Netlify Blobs) and CSV export.
// Server-only: imported by API routes and admin pages, never by client scripts.

import { getStore } from '@netlify/blobs';
import { services } from '../data/site';

export const STATUSES = ['new', 'in-progress', 'done'] as const;
export type Status = (typeof STATUSES)[number];
export const STATUS_LABEL: Record<Status, string> = { new: 'New', 'in-progress': 'In progress', done: 'Done' };

export const TIMELINES = { asap: 'As soon as possible', '1-3': 'In 1 to 3 months', exploring: 'Just exploring' } as const;
export type Timeline = keyof typeof TIMELINES;

/** When the visitor would like the call, in their own time zone. */
export const CALL_TIMES = {
  any: 'Any time',
  morning: 'Mornings (9 to 12)',
  afternoon: 'Afternoons (12 to 5)',
  evening: 'Evenings (5 to 8)',
} as const;
export type CallTime = keyof typeof CALL_TIMES;

export interface Brief {
  id: string;
  createdAt: string; // ISO 8601
  name: string;
  email: string;
  website: string;
  needs: string[];
  timeline: Timeline;
  /** Missing on briefs sent before the call request existed. */
  callTime?: CallTime;
  /** The visitor's IANA time zone, e.g. "Europe/Berlin"; empty if the browser did not say. */
  timezone?: string;
  message: string;
  status: Status;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIMITS = { name: 200, email: 254, website: 300, message: 5000 };

/** Strongly consistent so the admin list reflects a new brief or a status change right away. */
const store = () => getStore({ name: 'briefs', consistency: 'strong' });

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Validates a raw JSON body from the Contact form. Returns the clean fields or an error message. */
export function parseBrief(body: unknown): { ok: true; value: Omit<Brief, 'id' | 'createdAt' | 'status'> } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Expected a JSON object.' };
  const b = body as Record<string, unknown>;
  const name = text(b.name, LIMITS.name);
  const email = text(b.email, LIMITS.email);
  if (!name) return { ok: false, error: 'Name is required.' };
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'A valid email is required.' };
  const known = new Set<string>(services);
  const needs = Array.isArray(b.needs) ? [...new Set(b.needs.filter((n): n is string => typeof n === 'string' && known.has(n)))] : [];
  const timeline = typeof b.timeline === 'string' && b.timeline in TIMELINES ? (b.timeline as Timeline) : 'exploring';
  const callTime = typeof b.callTime === 'string' && b.callTime in CALL_TIMES ? (b.callTime as CallTime) : 'any';
  const zone = text(b.timezone, 64);
  const timezone = /^[A-Za-z][\w+\-/]*$/.test(zone) ? zone : '';
  return {
    ok: true,
    value: {
      name,
      email,
      website: text(b.website, LIMITS.website),
      needs,
      timeline,
      callTime,
      timezone,
      message: text(b.message, LIMITS.message),
    },
  };
}

/** Keys sort by time: base36 epoch milliseconds (fixed 8 characters until 2059) plus a random suffix. */
const newId = () => `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;

export async function saveBrief(fields: Omit<Brief, 'id' | 'createdAt' | 'status'>): Promise<Brief> {
  const brief: Brief = { id: newId(), createdAt: new Date().toISOString(), status: 'new', ...fields };
  await store().setJSON(brief.id, brief);
  return brief;
}

/** Every brief, newest first. Volumes for an agency inbox are small, so one read per brief is fine. */
export async function listBriefs(): Promise<Brief[]> {
  const s = store();
  const { blobs } = await s.list();
  const items = await Promise.all(blobs.map((b) => s.get(b.key, { type: 'json' }) as Promise<Brief | null>));
  return items.filter((b): b is Brief => !!b).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

const isId = (id: string) => /^[0-9a-z]{6,12}-[0-9a-f]{8}$/.test(id);

export async function setStatus(id: string, status: Status): Promise<boolean> {
  if (!isId(id)) return false;
  const s = store();
  const brief = (await s.get(id, { type: 'json' })) as Brief | null;
  if (!brief) return false;
  await s.setJSON(id, { ...brief, status });
  return true;
}

export async function deleteBrief(id: string): Promise<boolean> {
  if (!isId(id)) return false;
  await store().delete(id);
  return true;
}

/** "Afternoons (12 to 5)"; empty for briefs sent before the call request existed. */
export const callTimeLabel = (b: Brief): string => (b.callTime ? CALL_TIMES[b.callTime] : '');

/** "yourdomain.com" or "https://..." to a safe http(s) URL, or null if it is not one. */
export function websiteUrl(raw: string): string | null {
  if (!raw) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

/** CSV with every field; cells that a spreadsheet would run as a formula are neutralised. */
export function toCsv(briefs: Brief[]): string {
  const cell = (v: string) => {
    const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const head = ['Date', 'Status', 'Name', 'Email', 'Website', 'Needs', 'Timeline', 'Call time', 'Time zone', 'Message'];
  const rows = briefs.map((b) =>
    [
      b.createdAt,
      STATUS_LABEL[b.status],
      b.name,
      b.email,
      b.website,
      b.needs.join(', '),
      TIMELINES[b.timeline],
      callTimeLabel(b),
      b.timezone ?? '',
      b.message,
    ]
      .map(cell)
      .join(','),
  );
  return `﻿${[head.map(cell).join(','), ...rows].join('\r\n')}\r\n`; // BOM so Excel reads UTF-8
}
