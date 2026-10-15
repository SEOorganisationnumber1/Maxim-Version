// /favicon.ico for browsers and tools that ask for it by name; modern browsers use /favicon.svg.
import type { APIRoute } from 'astro';
import { renderIcon, toIco } from '../lib/og';

export const prerender = true;

export const GET: APIRoute = async () => {
  const images = await Promise.all([16, 32, 48].map(async (size) => ({ size, png: await renderIcon(size, { inset: 0.04 }) })));
  return new Response(toIco(images), { headers: { 'Content-Type': 'image/x-icon' } });
};
