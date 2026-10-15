import type { APIRoute } from 'astro';
import { projects, projectUrl, serviceLine } from '../data/projects';
import { services, site } from '../data/site';

// A plain-text map of the site for AI engines (https://llmstxt.org).
export const GET: APIRoute = ({ site: base }) => {
  const url = (path: string) => new URL(path, base).href;
  const work = projects
    .map((p) => {
      const caseUrl = projectUrl(p);
      return caseUrl
        ? `- [${p.name}](${url(caseUrl)}): ${serviceLine(p.services)}`
        : `- ${p.name}: ${serviceLine(p.services)}`;
    })
    .join('\n');
  const contact = site.email ? `\n\nEmail: ${site.email}` : '';

  const body = `# ${site.name}

> ${site.tagline} A search-first studio for ${services.join(', ')}.

## Pages

- [Home](${url('/')}): What we do and companies we scaled
- [Work](${url('/work')}): Client projects and case studies
- [Services](${url('/services')}): Design, Web Development, SEO, GEO and AEO; stack, pricing and FAQ
- [Clients](${url('/clients')}): Brands we work with and what we did for each
- [Company](${url('/company')}): How we work and the rules we keep
- [Contact](${url('/contact')}): Send a brief${contact}

## Clients

${work}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
