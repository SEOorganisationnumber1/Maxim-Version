// POST /api/brief: the Contact form sends its JSON here and the brief lands in the admin inbox.
import type { APIRoute } from 'astro';
import { parseBrief, saveBrief } from '../../lib/briefs';
import { clientIp, sameOrigin, withinLimit } from '../../lib/admin-auth';

export const prerender = false;

const MAX_BODY_BYTES = 20_000;
const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export const POST: APIRoute = async (context) => {
  const { request } = context;
  if (!sameOrigin(request)) return json(403, { error: 'Forbidden.' });
  if (!request.headers.get('content-type')?.includes('application/json')) return json(415, { error: 'Send JSON.' });

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json(413, { error: 'Brief is too long.' });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: 'Invalid JSON.' });
  }

  // Honeypot: the form hides a "company" field that only bots fill in. Answer OK, store nothing.
  if (typeof (body as Record<string, unknown>)?.company === 'string' && (body as { company: string }).company.trim()) {
    return json(200, { ok: true });
  }

  const parsed = parseBrief(body);
  if (!parsed.ok) return json(422, { error: parsed.error });

  // clientAddress is a getter that throws where the platform does not expose it: read it lazily.
  if (!(await withinLimit('brief', clientIp(() => context.clientAddress), 5, 10 * 60_000))) {
    return json(429, { error: 'Too many briefs from this connection. Please try again in a few minutes.' });
  }

  const brief = await saveBrief(parsed.value);
  return json(201, { ok: true, id: brief.id });
};
