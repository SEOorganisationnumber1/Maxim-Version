import type { Service } from './site';

// Card art. Each project cycles through these three looks, in order,
// exactly as the Work page in the design does.
export type Look = { tint: string; stroke: string; path: string; gradient: [string, string] };

export const looks: Look[] = [
  {
    tint: '#DFF6F9',
    stroke: '#22C3DD',
    path: 'M-40 200 C 100 80, 260 60, 320 150 C 380 240, 520 220, 660 120',
    gradient: ['#22D3DD', '#2F8CF6'],
  },
  {
    tint: '#E4EEFF',
    stroke: '#2F8CF6',
    path: 'M-40 60 C 140 20, 200 240, 340 170 C 460 110, 500 -10, 660 60',
    gradient: ['#2F8CF6', '#5B4FE9'],
  },
  {
    tint: '#EAE8FF',
    stroke: '#5B4FE9',
    path: 'M-40 140 C 80 260, 220 20, 340 110 C 440 190, 520 240, 660 180',
    gradient: ['#5B4FE9', '#22D3DD'],
  },
];

export type Result = { value: string; label: string };

export type CaseStudy = {
  /** One sentence under the h1. */
  intro: string;
  industry: string;
  timeline: string;
  year: string;
  results: Result[];
  challenge: string;
  /** "What we did" copy, one entry per service the project used. */
  work: Partial<Record<Service, string>>;
  outcome: string;
  quote: string;
  quoteName: string;
  quoteRole: string;
};

export type Project = {
  slug: string;
  name: string;
  services: Service[];
  /** Short line on Work and Home cards. */
  summary: string;
  /** Lower-case line on the Clients page: "Web development, SEO and GEO". */
  clientLine: string;
  /** True for the [CLIENT NAME] slots that still need a real project. */
  placeholder: boolean;
  look: Look;
  caseStudy: CaseStudy;
};

// Placeholder copy per service for the "What we did" block.
const workCopy: Record<Service, string> = {
  Design: '[WHAT WAS DESIGNED: brand, interface and component system.]',
  'Web Development': '[WHAT WAS BUILT: stack, key pages, performance work.]',
  SEO: '[TECHNICAL FIXES, CONTENT PLAN AND AUTHORITY WORK.]',
  GEO: '[HOW THE BRAND WAS MADE READABLE AND CITABLE FOR AI ENGINES.]',
  AEO: '[WHICH QUESTIONS WERE TARGETED AND THE ANSWER FORMATS THAT WON.]',
};

const placeholderCase = (services: Service[]): CaseStudy => ({
  intro:
    '[ONE-SENTENCE SUMMARY: who the client is, what they needed, and what changed after we worked together.]',
  industry: '[INDUSTRY]',
  timeline: '[X MONTHS]',
  year: '[YEAR]',
  results: [
    { value: '[+X%]', label: 'organic traffic' },
    { value: '[X]', label: 'keywords in the top 3' },
    { value: '[X]', label: 'qualified leads per month' },
  ],
  challenge:
    '[WHERE THE CLIENT STARTED: traffic, rankings, how the site performed, and what was not working.]',
  work: Object.fromEntries(services.map((s) => [s, workCopy[s]])),
  outcome:
    '[WHAT CHANGED FOR THE BUSINESS: leads, revenue, visibility, and over what period.]',
  quote: '[CLIENT QUOTE: one or two sentences, in their own words, about the result.]',
  quoteName: '[NAME]',
  quoteRole: '[ROLE]',
});

/** "Web development, SEO and GEO" from ['Web Development', 'SEO', 'GEO']. */
const toClientLine = (services: Service[]): string => {
  const words = services.map((s) => (s.toUpperCase() === s ? s : s.toLowerCase()));
  const line =
    words.length < 2
      ? words.join('')
      : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
  return line.charAt(0).toUpperCase() + line.slice(1);
};

type Seed = { slug: string; name: string; services: Service[]; placeholder?: boolean };

const seeds: Seed[] = [
  { slug: 'leadity-io', name: 'leadity.io', services: ['Web Development', 'SEO', 'GEO'] },
  { slug: 'instagram-com', name: 'instagram.com', services: ['SEO', 'AEO'] },
  { slug: 'zerodollars-xyz', name: 'zerodollars.xyz', services: ['Design', 'Web Development', 'SEO'] },
  { slug: 'client-4', name: '[CLIENT NAME]', services: ['Design', 'Web Development'], placeholder: true },
  { slug: 'client-5', name: '[CLIENT NAME]', services: ['GEO', 'AEO'], placeholder: true },
  { slug: 'client-6', name: '[CLIENT NAME]', services: ['SEO', 'GEO', 'AEO'], placeholder: true },
];

export const projects: Project[] = seeds.map((seed, i) => ({
  slug: seed.slug,
  name: seed.name,
  services: seed.services,
  summary: '[ONE-LINE SUMMARY OF THE PROJECT.]',
  clientLine: toClientLine(seed.services),
  placeholder: seed.placeholder ?? false,
  look: looks[i % looks.length]!,
  caseStudy: placeholderCase(seed.services),
}));

export const projectUrl = (p: Pick<Project, 'slug'>): string => `/work/${p.slug}`;

export const getProject = (slug: string): Project => {
  const p = projects.find((x) => x.slug === slug);
  if (!p) throw new Error(`Unknown project: ${slug}`);
  return p;
};

/** "Web Development · SEO · GEO" */
export const serviceLine = (services: readonly string[]): string => services.join(' · ');
