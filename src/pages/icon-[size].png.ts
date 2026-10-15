// /icon-192.png and /icon-512.png: listed in the web app manifest and used as the logo in JSON-LD.
import type { APIRoute, GetStaticPaths } from 'astro';
import { renderIcon } from '../lib/og';

export const prerender = true;

export const getStaticPaths = (() => ['192', '512'].map((size) => ({ params: { size } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) =>
  new Response(await renderIcon(Number(params.size), { background: '#FFFFFF', inset: 0.2 }), {
    headers: { 'Content-Type': 'image/png' },
  });
