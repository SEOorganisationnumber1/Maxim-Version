import type { ImageMetadata } from 'astro';
import type { Service } from './site';
import leadityShot from '../assets/work/leadity.webp';
import cryptoExchangeShot from '../assets/work/crypto-exchange-platform.webp';
import carPartsShot from '../assets/work/car-parts-store.webp';
import electronicsShot from '../assets/work/electronics-store.webp';
import reviewsShot from '../assets/work/reviews-site.webp';

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
  /** What it does, in a few plain words, for the Home cards (no tech stack). Falls back to the summary's first sentence. */
  plain: string | null;
  /** What kind of thing it is, in one or two words, for the Home work log: 'Website', 'Web app', 'Telegram bot'. */
  kind: string;
  /** The live product, linked from the cards so visitors can see the work for themselves. */
  site: string | null;
  /** A real screenshot of the product for the card (src/assets/work). Without it the card shows the wave art. */
  image: { src: ImageMetadata; alt: string } | null;
  /** Our own product rather than a client's: labelled so on the cards, never counted or shown as a client. */
  own: boolean;
  /**
   * Confirmed client work, shown as a client ("Trusted by", the Clients page) only when true and with
   * the client's agreement. Work that is neither `own` nor `client` is shown as something we built,
   * with no claim about who it was for.
   */
  client: boolean;
  /** Lower-case line on the Clients page: "Web development and search & growth". */
  clientLine: string;
  look: Look;
  /** Null until the case study is written: no page is built for it and cards do not link. */
  caseStudy: CaseStudy | null;
};

/** "Web apps & SaaS and AI & automation" from ['Web Apps & SaaS', 'AI & Automation']. */
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

type Seed = Pick<Project, 'slug' | 'name' | 'services' | 'kind'> & Partial<Pick<Project, 'summary' | 'plain' | 'site' | 'image' | 'own' | 'client' | 'caseStudy'>>;

// Real work only: every project here is shown on Home, Work and in llms.txt; clients (not `own`)
// also on Clients. Add `summary` and `caseStudy` (shape: CaseStudy above) as they are written;
// the case study page at /work/<slug> is published as soon as `caseStudy` is set. A summary says
// what the product is and what we built, never results that were not measured.
const seeds: Seed[] = [
  {
    slug: 'leadity-io',
    kind: 'Web app',
    plain: 'Finds local businesses on Google Maps, with the owner behind each one.',
    name: 'leadity.io',
    services: ['Websites & Landing Pages', 'Web Apps & SaaS', 'Search & Growth'],
    summary:
      'A lead generation platform for local business leads from Google Maps. We co-founded it and built the first version full stack, then the website, the user area and its SEO.',
    site: 'https://leadity.io',
    image: { src: leadityShot, alt: 'The leadity.io home page: a lead search with a map of the US and sample business owners' },
    own: true,
  },
  // From the owner's own repositories (2026-10-19). Shown without product names or links until the
  // owner says whether each one was client work and whether it is live; summaries come from the code.
  {
    slug: 'car-parts-store',
    kind: 'Website',
    plain: 'An online shop for car parts, from search to checkout.',
    name: 'Car parts store',
    services: ['Websites & Landing Pages'],
    summary:
      'An online store for car parts and performance accessories: shop, product pages, cart, checkout and customer account. React and TypeScript, with automated tests, shipped in Docker.',
    image: { src: carPartsShot, alt: 'The car parts store home page: "Premium car parts for your vehicle" with a wheel, a brake disc and a search by year, make and model' },
  },
  {
    slug: 'crypto-exchange-platform',
    kind: 'Web app',
    plain: 'People swap crypto for money sent straight to their bank card.',
    name: 'Crypto exchange platform',
    services: ['Web Apps & SaaS'],
    summary:
      'A crypto-to-fiat exchange: sign-up with email verification and KYC, a dashboard, exchanges with live status, wallet deposits by QR code, transaction history and an admin view. React and Supabase.',
    image: { src: cryptoExchangeShot, alt: 'The exchange home page: "Convert Crypto to Real Money in Minutes" next to a card of exchange rates' },
  },
  {
    slug: 'electronics-store',
    kind: 'Website',
    plain: 'An online electronics shop in several languages.',
    name: 'Electronics store',
    services: ['Websites & Landing Pages', 'Web Apps & SaaS'],
    summary:
      'An online electronics store in several languages: catalog, product pages, favorites, cart, accounts, orders and an admin page, with the catalog filled by import scripts we wrote. React and Supabase.',
    image: { src: electronicsShot, alt: 'The electronics store: search, catalog categories, brand logos and product tabs' },
  },
  {
    slug: 'reviews-site',
    kind: 'Website',
    plain: 'Customers post star ratings with photos; the owner approves them.',
    name: 'Reviews site',
    services: ['Websites & Landing Pages'],
    summary:
      'A reviews site for a crypto exchange service: visitors post star ratings with photos, and a password-protected admin panel moderates them. Next.js and Supabase.',
    image: { src: reviewsShot, alt: 'The reviews site home page: "Real Reviews from Real Users" with an Add Review button' },
  },
];

export const projects: Project[] = seeds.map((seed, i) => ({
  slug: seed.slug,
  name: seed.name,
  kind: seed.kind,
  services: seed.services,
  summary: seed.summary ?? null,
  plain: seed.plain ?? seed.summary?.split(/(?<=\.)\s/)[0] ?? null,
  site: seed.site ?? null,
  image: seed.image ?? null,
  own: seed.own ?? false,
  client: seed.client ?? false,
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
/** Confirmed client work only: our own products and unattributed work are never shown as clients. */
export const clients: Project[] = projects.filter((p) => p.client && !p.own);
export const showClientsPage = clients.length >= CLIENTS_PAGE_MIN;

/** The small line above a card's name: "Our own product", or the services we delivered. */
export const cardLine = (p: Project): string => (p.own ? 'Our own product' : serviceLine(p.services));

/** Where "see the proof" links point: the work once a case study exists, the services until then. */
export const proofLink = caseStudies.length > 0 ? { href: '/work', label: 'See the work' } : { href: '/services', label: 'See services' };

/** "Web Apps & SaaS · Search & Growth" */
export const serviceLine = (services: readonly string[]): string => services.join(' · ');
