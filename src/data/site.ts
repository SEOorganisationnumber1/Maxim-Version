// Agency-wide facts. Bracketed values are placeholders from the design:
// replace them here and every page picks up the change.

export const site = {
  name: '67 billion bucks Agency',
  tagline: 'More visibility. Better traffic. Qualified leads.',
  email: '[hello@youragency.com]',
  social: '[SOCIAL HANDLE]',
  location: '[CITY, COUNTRY]',
  responseTime: '[RESPONSE TIME]',
  year: 2026,
} as const;

export const services = ['Design', 'Web Development', 'SEO', 'GEO', 'AEO'] as const;
export type Service = (typeof services)[number];

export type NavItem = { href: string; label: string };

/** Header links; "Start a project" (Contact) is rendered separately as the CTA. */
export const mainNav: NavItem[] = [
  { href: '/work', label: 'Work' },
  { href: '/services', label: 'Services' },
  { href: '/clients', label: 'Clients' },
  { href: '/company', label: 'Company' },
];

export const footerNav: NavItem[] = [...mainNav, { href: '/contact', label: 'Contact' }];
