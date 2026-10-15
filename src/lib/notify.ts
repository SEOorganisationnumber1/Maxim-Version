// Email alert for each new brief, sent through Resend (https://resend.com).
// Server-only. Off until RESEND_API_KEY and BRIEF_NOTIFY_TO are set in Netlify; the brief is
// stored either way, so a failed or missing alert never loses a lead.

import { BRIEF_NOTIFY_FROM, BRIEF_NOTIFY_TO, RESEND_API_KEY } from 'astro:env/server';
import { site } from '../data/site';
import { TIMELINES, type Brief } from './briefs';

/** Resend's shared sender: works without a domain, but only delivers to the Resend account's own address. */
const DEFAULT_FROM = 'onboarding@resend.dev';
const TIMEOUT_MS = 5000;

export const notifyConfigured = (): boolean => Boolean(RESEND_API_KEY && BRIEF_NOTIFY_TO);

const oneLine = (value: string) => value.replace(/\s+/g, ' ').trim();

/** Plain text on purpose: nothing from the visitor is ever rendered as HTML in the inbox. */
function body(brief: Brief, adminUrl: string): string {
  return [
    `New brief from ${brief.name}`,
    '',
    `Email:    ${brief.email}`,
    `Website:  ${brief.website || 'Not given'}`,
    `Needs:    ${brief.needs.join(', ') || 'Not specified'}`,
    `Start:    ${TIMELINES[brief.timeline]}`,
    '',
    brief.message || 'No message.',
    '',
    '--',
    `Reply to this email to answer ${brief.name} directly.`,
    `All briefs: ${adminUrl}`,
  ].join('\n');
}

/** Sends the alert. Throws on a failed request; callers log it and carry on. */
export async function notifyNewBrief(brief: Brief, adminUrl: string): Promise<void> {
  if (!notifyConfigured()) return;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: BRIEF_NOTIFY_FROM || `${site.name} <${DEFAULT_FROM}>`,
      to: BRIEF_NOTIFY_TO!.split(',').map((address) => address.trim()).filter(Boolean),
      reply_to: brief.email,
      subject: oneLine(`New brief: ${brief.name}${brief.needs.length ? ` (${brief.needs.join(', ')})` : ''}`).slice(0, 200),
      text: body(brief, adminUrl),
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Resend answered ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
}
