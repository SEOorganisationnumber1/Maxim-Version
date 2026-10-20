// Share images (Open Graph), one per page, generated at build time by src/pages/og/[card].png.ts.
// Pages pass the card's key to Base as `og`; titles follow each page's h1.
import { caseStudies, serviceLine, type Look } from './projects';
import { offers, offerUrl } from './offers';

export type OgRun = { text: string; mark?: 'highlight' | 'accent' };
export type OgCard = {
  /** Page path, printed at the bottom of the image after the domain. */
  path: string;
  /** Words are separated by spaces; a highlight run never breaks across lines. */
  title: OgRun[];
  /** Mono line under the title. */
  sub?: string;
  tone: Look['tone'];
};

export const ogCards: Record<string, OgCard> = {
  home: {
    path: '/',
    tone: 'cyan',
    title: [{ text: 'Digital Products,' }, { text: 'Built', mark: 'highlight' }, { text: 'to Launch.', mark: 'accent' }],
  },
  work: { path: '/work', tone: 'cyan', title: [{ text: 'Products we' }, { text: 'built.', mark: 'highlight' }] },
  services: {
    path: '/services',
    tone: 'blue',
    title: [{ text: 'Design, code and growth.' }, { text: 'Built as one.', mark: 'highlight' }],
  },
  clients: { path: '/clients', tone: 'violet', title: [{ text: 'Teams we' }, { text: 'build with.', mark: 'highlight' }] },
  company: {
    path: '/company',
    tone: 'cyan',
    title: [{ text: 'A product studio for design, engineering and' }, { text: 'launch.', mark: 'highlight' }],
  },
  contact: {
    path: '/contact',
    tone: 'blue',
    title: [{ text: 'Book a free' }, { text: 'call.', mark: 'highlight' }],
  },
  privacy: { path: '/privacy', tone: 'violet', title: [{ text: 'Privacy policy' }] },
  ...Object.fromEntries(
    offers.map((o): [string, OgCard] => [
      `service-${o.slug}`,
      { path: offerUrl(o), tone: o.tone, title: [{ text: o.h1.lead }, { text: o.h1.mark, mark: 'highlight' }] },
    ]),
  ),
  ...Object.fromEntries(
    caseStudies.map((p): [string, OgCard] => [
      `work-${p.slug}`,
      { path: `/work/${p.slug}`, tone: p.look.tone, title: [{ text: p.name }], sub: `Case study · ${serviceLine(p.services)}` },
    ]),
  ),
};

export type OgKey = keyof typeof ogCards;
