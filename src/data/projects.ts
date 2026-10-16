import type { Service } from './site';

// Card art. Each project cycles through these three looks, in order,
// exactly as the Work page in the design does.
export type Look = {
  /** Tinted background of the art well: .shot--cyan, .shot--blue or .shot--violet. */
  tone: 'cyan' | 'blue' | 'violet';
  stroke: string;
  path: string;
  gradient: [string, string];
};

export const looks: Look[] = [
  {
    tone: 'cyan',
    stroke: '#22C3DD',
    path: 'M-40 200 C 100 80, 260 60, 320 150 C 380 240, 520 220, 660 120',
    gradient: ['#22D3DD', '#2F8CF6'],
  },
  {
    tone: 'blue',
    stroke: '#2F8CF6',
    path: 'M-40 60 C 140 20, 200 240, 340 170 C 460 110, 500 -10, 660 60',
    gradient: ['#2F8CF6', '#5B4FE9'],
  },
  {
    tone: 'violet',
    stroke: '#5B4FE9',
    path: 'M-40 140 C 80 260, 220 20, 340 110 C 440 190, 520 240, 660 180',
    gradient: ['#5B4FE9', '#22D3DD'],
  },
];

export type Result = { value: string; label: string };

export type CaseStudy = {
  /** Publication date, YYYY-MM-DD, used in the Article JSON-LD. */
  published: string;
  /** One sentence under the h1. */
  intro: string;
  industry: string;
  /** For example '6 months'. */
  timeline: string;
  year: string;
  /** Headline numbers; the first one also appears on the Home card. */
  results: Result[];
  challenge: string;
  /** "What we did" copy, one entry per service the project used. */
  work: Partial<Record<Service, string>>;
  outcome: string;
  /** Optional client quote under the story, in their own words and with their permission. */
  quote?: { text: string; name: string; role: string };
};

export type Project = {
  slug: string;
  name: string;
  services: Service[];
  /** One line on the Home and Work cards; hidden while null. */
  summary: string | null;
  /** The live product, linked from the cards so visitors can see the work for themselves. */
  site: string | null;
  /** Lower-case line on the Clients page: "Web development and search & growth". */
  clientLine: string;
  look: Look;
  /** Null until the case study is written: no page is built for it and cards do not link. */
  caseStudy: CaseStudy | null;
};

/** "Web development and AI & automation" from ['Web Development', 'AI & Automation']. */
const toClientLine = (services: Service[]): string => {
  // Lower-case ordinary words; keep acronyms and mixed-case terms such as AI and SaaS as written.
  const words = services.map((s) =>
    s
      .split(' ')
      .map((w) => (/[A-Z].*[A-Z]/.test(w) ? w : w.toLowerCase()))
      .join(' '),
  );
  const line =
    words.length < 2
      ? words.join('')
      : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
  return line.charAt(0).toUpperCase() + line.slice(1);
};

type Seed = Pick<Project, 'slug' | 'name' | 'services'> & Partial<Pick<Project, 'summary' | 'site' | 'caseStudy'>>;

// Real clients only: every project here is shown on Home, Work, Clients and in llms.txt.
// Add `summary` and `caseStudy` (shape: CaseStudy above) as they are written; the case study
// page at /work/<slug> is published as soon as `caseStudy` is set. A summary says what the
// client's product is (from its own public site), never results that were not measured.
const seeds: Seed[] = [
  {
    slug: 'leadity-io',
    name: 'leadity.io',
    services: ['Web Development', 'Search & Growth'],
    summary: 'A lead generation platform: local business leads from Google Maps, for the US, Canada, the UK and Australia.',
    site: 'https://leadity.io',
  },
];

export const projects: Project[] = seeds.map((seed, i) => ({
  slug: seed.slug,
  name: seed.name,
  services: seed.services,
  summary: seed.summary ?? null,
  site: seed.site ?? null,
  clientLine: toClientLine(seed.services),
  look: looks[i % looks.length]!,
  caseStudy: seed.caseStudy ?? null,
}));

export type PublishedProject = Project & { caseStudy: CaseStudy };

/** Projects whose case study is written, in seed order. */
export const caseStudies: PublishedProject[] = projects.filter((p): p is PublishedProject => p.caseStudy !== null);

/** The case study URL, or null while it is not written. */
export const projectUrl = (p: Project): string | null => (p.caseStudy ? `/work/${p.slug}` : null);

/**
 * The Clients page is linked (nav, footer, sitemap, llms.txt) only once it can show this many
 * clients. Below that it repeats the Work page with a line or two, which reads as thin proof.
 */
export const CLIENTS_PAGE_MIN = 3;
export const showClientsPage = projects.length >= CLIENTS_PAGE_MIN;

/** Where "see the proof" links point: the work once a case study exists, the services until then. */
export const proofLink = caseStudies.length > 0 ? { href: '/work', label: 'See the work' } : { href: '/services', label: 'See services' };

/** "Web Development · SEO · GEO" */
export const serviceLine = (services: readonly string[]): string => services.join(' · ');
