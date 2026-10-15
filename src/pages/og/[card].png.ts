// /og/<card>.png: the share image of each page (see src/data/og.ts), rendered at build time.
import type { APIRoute, GetStaticPaths } from 'astro';
import { ogCards, type OgCard } from '../../data/og';
import { renderOgImage } from '../../lib/og';

export const prerender = true;

export const getStaticPaths = (() =>
  Object.entries(ogCards).map(([card, data]) => ({ params: { card }, props: { data } }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ data: OgCard }> = async ({ props, site }) =>
  new Response(await renderOgImage(props.data, site ?? new URL('https://localhost')), {
    headers: { 'Content-Type': 'image/png' },
  });
