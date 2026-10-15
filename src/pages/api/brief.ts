// POST /api/brief: the Contact form sends a brief here. It lands in the admin inbox and, once
// Resend is set up, an email alert goes out. The page's script sends JSON and gets JSON back;
// a browser without JavaScript posts the form itself and is redirected to /contact/sent.
import type { APIRoute } from 'astro';
import { parseBrief, saveBrief } from '../../lib/briefs';
import { clientIp, sameOrigin, withinLimit } from '../../lib/admin-auth';
import { notifyNewBrief } from '../../lib/notify';

export const prerender = false;

const MAX_BODY_BYTES = 20_000;
const NO_STORE = { 'Cache-Control': 'no-store' };

type Reply = { ok: (id: string) => Response; error: (status: number, message: string) => Response };

const jsonReply: Reply = {
  ok: (id) => Response.json({ ok: true, id }, { status: 201, headers: NO_STORE }),
  error: (status, message) => Response.json({ error: message }, { status, headers: NO_STORE }),
};

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Plain form posts: success goes to the thank-you page, a problem gets a short page with a way back. */
const formReply: Reply = {
  ok: () => new Response(null, { status: 303, headers: { Location: '/contact/sent', ...NO_STORE } }),
  error: (status, message) =>
    new Response(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Brief not sent</title><style>body{margin:0;background:#F5FAFC;color:#0A1128;font:17px/1.6 system-ui,sans-serif}main{max-width:560px;margin:0 auto;padding:96px 24px}h1{margin:0 0 16px;font-size:40px;line-height:1.1}a{color:#0A1128;font-weight:700}</style></head><body><main><h1>Your brief was not sent.</h1><p>${escapeHtml(message)}</p><p>Go back to keep what you typed, or <a href="/contact">open the form again</a>.</p></main></body></html>`,
      { status, headers: { 'Content-Type': 'text/html; charset=utf-8', ...NO_STORE } },
    ),
};

/** The form's fields as one object, the same shape the script sends as JSON. */
function fromForm(form: FormData): Record<string, unknown> {
  const text = (key: string) => String(form.get(key) ?? '');
  return {
    name: text('name'),
    email: text('email'),
    website: text('website'),
    needs: form.getAll('needs').map(String),
    timeline: text('timeline'),
    message: text('message'),
    company: text('company'),
  };
}

export const POST: APIRoute = async (context) => {
  const { request, locals } = context;
  const type = request.headers.get('content-type') ?? '';
  const isJson = type.includes('application/json');
  const isForm = type.includes('application/x-www-form-urlencoded') || type.includes('multipart/form-data');
  const reply = isJson ? jsonReply : formReply;

  if (!sameOrigin(request)) return reply.error(403, 'This request was blocked. Reload the contact page and try again.');
  if (!isJson && !isForm) return jsonReply.error(415, 'Send JSON or a form.');
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    return reply.error(413, 'Your brief is too long. Please shorten the message.');
  }

  let body: unknown;
  try {
    if (isJson) {
      const raw = await request.text();
      if (raw.length > MAX_BODY_BYTES) return reply.error(413, 'Your brief is too long. Please shorten the message.');
      body = JSON.parse(raw);
    } else {
      body = fromForm(await request.formData());
    }
  } catch {
    return reply.error(400, 'The brief could not be read. Please try again.');
  }

  // Honeypot: the form hides a "company" field that only bots fill in. Answer OK, store nothing.
  const company = (body as Record<string, unknown> | null)?.company;
  if (typeof company === 'string' && company.trim()) return reply.ok('');

  const parsed = parseBrief(body);
  if (!parsed.ok) return reply.error(422, parsed.error);

  // clientAddress is a getter that throws where the platform does not expose it: read it lazily.
  if (!(await withinLimit('brief', clientIp(() => context.clientAddress), 5, 10 * 60_000))) {
    return reply.error(429, 'Too many briefs from this connection. Please try again in a few minutes.');
  }

  const brief = await saveBrief(parsed.value);

  // The brief is safe in the inbox now; the email alert must never turn that into an error.
  const alert = notifyNewBrief(brief, new URL('/admin', request.url).href).catch((error: unknown) => {
    console.error('[brief] Email alert failed.', error);
  });
  const netlify = locals.netlify?.context;
  if (netlify) netlify.waitUntil(alert);
  else await alert;

  return reply.ok(brief.id);
};
