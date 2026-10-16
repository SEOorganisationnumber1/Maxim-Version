// Agency-wide facts and the content that is still to come. Anything left null, or an empty
// list, is simply not shown: the line or section that needs it stays hidden until it is set.
// The build fails if a bracketed placeholder such as [X] reaches a page, so never type one here.

import { showClientsPage } from './projects';

export type Social = { label: string; url: string };
export type Testimonial = { quote: string; name: string; role: string; company: string };
export type TeamMember = {
  name: string;
  role: string;
  /** Square-ish photo under public/, e.g. '/team/ana.jpg'. Without it the card shows a tinted well. */
  photo?: string;
};

export const site = {
  /** Full name: titles, JSON-LD, share images, legal text. */
  name: 'Launchery Studio',
  /** The wordmark; the rest of the name ("Studio") is set smaller next to it. */
  shortName: 'Launchery',
  tagline: 'Strong design. Solid engineering. Reliable launches.',
  /** Public contact email, e.g. 'hello@yourdomain.com'. */
  email: null as string | null,
  /** Profiles linked in the footer and listed in the Organization JSON-LD (sameAs). */
  socials: [] as Social[],
  /** 'City, Country', shown in the footer. */
  location: null as string | null,
  /** Ends "We will reply to you within ...", e.g. 'one business day'. Matches the free-estimate term on Services. */
  responseTime: 'two business days' as string | null,
};

/** The business behind the site, named in the privacy policy as the data controller. */
export const legal = {
  /** Registered name, e.g. 'Example SRL'. Until it is set, the policy names the agency. */
  entity: null as string | null,
  /** Registration and tax numbers, as they appear on invoices. */
  registration: null as string | null,
  /** Registered address. */
  address: null as string | null,
};

/** Agency numbers for the Home and Company bands, written as displayed ('40+', '92%'). */
export const numbers = {
  projectsShipped: null as string | null,
  yearsInBusiness: null as string | null,
  marketsServed: null as string | null,
  /** Share of clients who stay past year one. */
  retention: null as string | null,
  founded: null as string | null,
  teamSize: null as string | null,
};

export const plans = ['Launch', 'Growth', 'Full stack'] as const;
export type PlanName = (typeof plans)[number];

/**
 * Plan starting prices on Services, written as displayed ('$600'); the page shows them as "From $600".
 * Unset plans read "Custom quote". Approved by the owner on 2026-10-16, set near the low end of
 * freelance market rates (Upwork, Fiverr) and well below studio rates.
 */
export const prices: Record<PlanName, string | null> = {
  Launch: '$600',
  Growth: '$500',
  'Full stack': '$1,500',
};

/** Client quotes on the Clients page, in the client's own words and with their permission. */
export const testimonials: Testimonial[] = [];

/** People on the Company page. */
export const team: TeamMember[] = [];

/** What we build, by kind of project. UI and UX design is part of every one of them. */
export const services = [
  'Websites & Landing Pages',
  'Web Apps & SaaS',
  'Mobile & Desktop Apps',
  'Telegram Bots & Extensions',
  'AI & Automation',
  'Search & Growth',
] as const;
export type Service = (typeof services)[number];

/** A starting price: the lowest a typical project of this kind costs. The final price is fixed per written scope. */
export type StartingPrice = { item: string; amount: number; monthly?: boolean };

/** Starting prices by kind of project (USD), shown on Services, Home and in llms.txt. Same basis as `prices`. */
export const startingPrices: Record<Service, StartingPrice[]> = {
  'Websites & Landing Pages': [
    { item: 'Landing page', amount: 600 },
    { item: 'Website with 5 to 10 pages', amount: 1500 },
  ],
  'Web Apps & SaaS': [{ item: 'Web app or SaaS, first version', amount: 5000 }],
  'Mobile & Desktop Apps': [
    { item: 'Desktop app', amount: 1500 },
    { item: 'Mobile app for iOS and Android', amount: 3500 },
  ],
  'Telegram Bots & Extensions': [
    { item: 'Telegram bot', amount: 300 },
    { item: 'Browser extension', amount: 700 },
    { item: 'Telegram Mini App', amount: 1000 },
  ],
  'AI & Automation': [
    { item: 'Workflow automation', amount: 500 },
    { item: 'AI assistant on your own documents', amount: 1500 },
  ],
  'Search & Growth': [
    { item: 'Monthly SEO', amount: 500, monthly: true },
    { item: 'Technical SEO audit with fixes', amount: 800 },
  ],
};

/** "$1,500" or "$500 per month". */
export const formatPrice = (p: StartingPrice): string => `$${p.amount.toLocaleString('en-US')}${p.monthly ? ' per month' : ''}`;

/** The lowest starting price of a kind of project, for one-line mentions ("From $300"). */
export const lowestPrice = (service: Service): StartingPrice =>
  startingPrices[service].reduce((low, p) => (p.amount < low.amount ? p : low));

export type NavItem = { href: string; label: string };

/** Header links; "Start a project" (Contact) is rendered separately as the CTA. Clients joins once it has enough clients to show. */
export const mainNav: NavItem[] = [
  { href: '/work', label: 'Work' },
  { href: '/services', label: 'Services' },
  ...(showClientsPage ? [{ href: '/clients', label: 'Clients' }] : []),
  { href: '/company', label: 'Company' },
];

export const footerNav: NavItem[] = [...mainNav, { href: '/contact', label: 'Contact' }];

/** A stat band entry: shown only once its value is set. */
export type Stat = { value: string | null; label: string };
export const filled = (stats: Stat[]): { value: string; label: string }[] =>
  stats.flatMap((s) => (s.value ? [{ value: s.value, label: s.label }] : []));
