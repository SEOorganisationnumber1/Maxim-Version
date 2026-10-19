import type { APIRoute } from 'astro';
import { projects, projectUrl, serviceLine, showClientsPage, type Project } from '../data/projects';
import { formatPrice, services, site, startingPrices } from '../data/site';

// A plain-text map of the site for AI engines (https://llmstxt.org).
export const GET: APIRoute = ({ site: base }) => {
  const url = (path: string) => new URL(path, base).href;
  const line = (p: Project) => {
    const caseUrl = projectUrl(p);
    const name = caseUrl ? `[${p.name}](${url(caseUrl)})` : p.name;
    const details = [p.summary, `What we built: ${serviceLine(p.services)}.`, p.site && `Live site: ${p.site}`]
      .filter(Boolean)
      .join(' ');
    return `- ${name}: ${details}`;
  };
  // Our own products and client work are listed apart, so nothing of ours reads as a client.
  const section = (title: string, list: Project[]) => (list.length ? `\n\n## ${title}\n\n${list.map(line).join('\n')}` : '');
  const own = section('Our own products', projects.filter((p) => p.own));
  const clientWork = section('Clients', projects.filter((p) => p.client && !p.own));
  const otherWork = section('Other work we built', projects.filter((p) => !p.client && !p.own));
  const contact = site.email ? `\n\nEmail: ${site.email}` : '';
  const pricing = services
    .map((s) => `- ${s}: ${startingPrices[s].map((p) => `${p.item} from ${formatPrice(p)}`).join('; ')}`)
    .join('\n');
  const clientsPage = showClientsPage ? `\n- [Clients](${url('/clients')}): Teams we build with and what we built for each` : '';

  const body = `# ${site.name}

> ${site.tagline} ${site.name} designs and builds websites, web and mobile apps, desktop apps, Telegram bots, browser extensions and AI features, then helps them grow through search.

What we build: ${services.join(', ')}. UI and UX design is part of every project.

## Pages

- [Home](${url('/')}): What we build and our latest work
- [Work](${url('/work')}): Products we built and case studies
- [Services](${url('/services')}): Every kind of project we take on, our stack, plans and FAQ${clientsPage}
- [Company](${url('/company')}): How we work and the rules we keep
- [Contact](${url('/contact')}): Send a brief${contact}

## Starting prices (USD)

${pricing}

Every project gets a fixed price for a written scope. The estimate is free and arrives within two business days of a brief.${own}${clientWork}${otherWork}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
