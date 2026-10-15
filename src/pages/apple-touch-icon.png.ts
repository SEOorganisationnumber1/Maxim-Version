// /apple-touch-icon.png: the home screen icon on iPhone and iPad (iOS rounds the corners itself).
import type { APIRoute } from 'astro';
import { renderIcon } from '../lib/og';

export const prerender = true;

export const GET: APIRoute = async () =>
  new Response(await renderIcon(180, { background: '#FFFFFF', inset: 0.2 }), { headers: { 'Content-Type': 'image/png' } });
