import type { APIRoute } from 'astro';
import { projects, projectUrl, serviceLine } from '../data/projects';
import { services, site } from '../data/site';

// A plain-text map of the site for AI engines (https://llmstxt.org).
export const GET: APIRoute = ({ site: base }) => {
  const url = (path: string) => new URL(path, base).href;
  const work = projects
    .filter((p) => !p.placeholder)
    .map((p) => `- [${p.name}](${url(projectUrl(p))}): ${serviceLine(p.services)}`)
    .join('\n');

  const body = `# ${site.name}

> ${site.tagline} A search-first studio for ${services.join(', ')}.

## Pages

- [Home](${url('/')}): What we do and companies we scaled
- [Work](${url('/work')}): Case studies, filterable by service
- [Services](${url('/services')}): Design, Web Development, SEO, GEO and AEO; stack, pricing and FAQ
- [Clients](${url('/clients')}): Brands we work with and what clients say
- [Company](${url('/company')}): How we work and who does the work
- [Contact](${url('/contact')}): Send a brief

## Case studies

${work}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
