import type { APIRoute } from 'astro';
import { projects, projectUrl, serviceLine, showClientsPage } from '../data/projects';
import { services, site } from '../data/site';

// A plain-text map of the site for AI engines (https://llmstxt.org).
export const GET: APIRoute = ({ site: base }) => {
  const url = (path: string) => new URL(path, base).href;
  const work = projects
    .map((p) => {
      const caseUrl = projectUrl(p);
      const name = caseUrl ? `[${p.name}](${url(caseUrl)})` : p.name;
      const details = [p.summary, `Services: ${serviceLine(p.services)}.`, p.site && `Live site: ${p.site}`].filter(Boolean).join(' ');
      return `- ${name}: ${details}`;
    })
    .join('\n');
  const contact = site.email ? `\n\nEmail: ${site.email}` : '';
  const clientsPage = showClientsPage ? `\n- [Clients](${url('/clients')}): Teams we build with and what we built for each` : '';

  const body = `# ${site.name}

> ${site.tagline} ${site.name} is a product studio: one team designs, builds, launches and grows websites, web apps, SaaS and AI products.

Services: ${services.join(', ')}.

## Pages

- [Home](${url('/')}): What we build and recent launches
- [Work](${url('/work')}): Client projects and case studies
- [Services](${url('/services')}): Product design, web development, web apps and SaaS, AI and automation, search and growth; stack, pricing and FAQ${clientsPage}
- [Company](${url('/company')}): How we work and the rules we keep
- [Contact](${url('/contact')}): Send a brief${contact}

## Clients

${work}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
