// GET /admin/export.csv: every brief as a spreadsheet (Excel and Google Sheets read it).
import type { APIRoute } from 'astro';
import { listBriefs, toCsv } from '../../lib/briefs';
import { ADMIN_HEADERS, isSignedIn } from '../../lib/admin-auth';

export const prerender = false;

export const GET: APIRoute = async ({ cookies, redirect }) => {
  if (!(await isSignedIn(cookies))) return redirect('/admin/login', 303);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(await listBriefs()), {
    headers: {
      ...ADMIN_HEADERS,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="briefs-${date}.csv"`,
    },
  });
};
