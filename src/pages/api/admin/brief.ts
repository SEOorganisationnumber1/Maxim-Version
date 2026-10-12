// POST /api/admin/brief: change a brief's status or delete it. Plain HTML forms in the
// admin page post here and are redirected back, so it works without JavaScript.
import type { APIRoute } from 'astro';
import { STATUSES, deleteBrief, setStatus, type Status } from '../../../lib/briefs';
import { ADMIN_HEADERS, isSignedIn, sameOrigin } from '../../../lib/admin-auth';

export const prerender = false;

/** Back to the list the form came from (only same-site /admin paths). */
function backTo(returnTo: FormDataEntryValue | null, notice: string): string {
  const target = typeof returnTo === 'string' && returnTo.startsWith('/admin') && !returnTo.startsWith('//') ? returnTo : '/admin';
  const url = new URL(target, 'http://x');
  url.searchParams.set('notice', notice);
  return `${url.pathname}${url.search}`;
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  if (!sameOrigin(request)) return new Response('Forbidden', { status: 403, headers: ADMIN_HEADERS });
  if (!(await isSignedIn(cookies))) return redirect('/admin/login', 303);

  const form = await request.formData();
  const id = String(form.get('id') ?? '');
  const action = form.get('action');
  const returnTo = form.get('returnTo');

  if (action === 'delete') {
    const done = await deleteBrief(id);
    return redirect(backTo(returnTo, done ? 'deleted' : 'not-found'), 303);
  }
  if (action === 'status') {
    const status = String(form.get('status') ?? '') as Status;
    if (!STATUSES.includes(status)) return new Response('Unknown status', { status: 400, headers: ADMIN_HEADERS });
    const done = await setStatus(id, status);
    return redirect(backTo(returnTo, done ? 'updated' : 'not-found'), 303);
  }
  return new Response('Unknown action', { status: 400, headers: ADMIN_HEADERS });
};
