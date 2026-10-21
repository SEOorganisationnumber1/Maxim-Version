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
  /** How fast a request gets an answer. Ends "We will reply to you within ...". The fixed price takes longer (two business days, on Services). */
  responseTime: 'one business day' as string | null,
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

// No prices on the site (owner's decision, 2026-10-20): every project is priced per case, in writing,
// after a free call. Keep amounts out of pages, llms.txt and structured data.
export const plans = ['Launch', 'Growth', 'Full stack'] as const;
export type PlanName = (typeof plans)[number];

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

export type NavItem = { href: string; label: string };

/** Header links; "Book a call" (Contact) is rendered separately as the CTA. Clients joins once it has enough clients to show. */
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
