// Security headers for on-demand responses (/admin, /api). Static pages get the same headers
// from netlify.toml, which Netlify does not apply to function responses: keep the two lists equal.
// The Content-Security-Policy itself comes from astro.config.mjs (security.csp).
import { defineMiddleware } from 'astro:middleware';

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  if (context.isPrerendered) return response;
  // Some responses (redirects among them) have read-only headers: copy those before adding ours.
  let out = response;
  try {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) out.headers.set(name, value);
  } catch {
    out = new Response(response.body, response);
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) out.headers.set(name, value);
  }
  return out;
});
