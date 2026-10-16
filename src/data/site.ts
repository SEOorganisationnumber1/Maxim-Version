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
  /** Ends "We will reply to you within ...", e.g. 'one business day'. */
  responseTime: null as string | null,
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

/** Plan prices on Services, written as displayed ('€4,900', 'from €1,500'). Unset plans read "Custom quote". */
export const prices: Record<PlanName, string | null> = {
  Launch: null,
  Growth: null,
  'Full stack': null,
};

/** Client quotes on the Clients page, in the client's own words and with their permission. */
export const testimonials: Testimonial[] = [];

/** People on the Company page. */
export const team: TeamMember[] = [];

export const services = ['Product Design', 'Web Development', 'Web Apps & SaaS', 'AI & Automation', 'Search & Growth'] as const;
export type Service = (typeof services)[number];

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
