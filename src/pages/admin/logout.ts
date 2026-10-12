// POST /admin/logout: end the admin session.
import type { APIRoute } from 'astro';
import { endSession, sameOrigin } from '../../lib/admin-auth';

export const prerender = false;

export const POST: APIRoute = ({ request, cookies, redirect }) => {
  if (!sameOrigin(request)) return new Response('Forbidden', { status: 403 });
  endSession(cookies);
  return redirect('/admin/login?notice=signed-out', 303);
};
