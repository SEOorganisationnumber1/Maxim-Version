// How every project works, approved by the owner on 2026-10-16. These are promises the studio keeps:
// change them here first if the way of working changes. How we work shows all of them as the signed
// agreement; Home and Services show the four that matter most and link there.

export type Term = { title: string; text: string };

export const terms: Term[] = [
  {
    title: 'Free estimate',
    text: 'Book a call or send a brief, and within two business days you get our approach and a fixed price in writing. It costs nothing.',
  },
  {
    title: 'Fixed price, written scope',
    text: 'The price is fixed for the scope we agree in writing. Anything new gets its own price and timeline, and you approve it before we start.',
  },
  {
    title: 'Pay in stages',
    text: '50% to start and 50% at launch. Larger projects pay in three stages: 30% to start, 40% when the design is approved and 30% at launch.',
  },
  {
    title: 'You own everything',
    text: 'Code, design files and accounts are yours once the final payment is made. Domain, hosting and app store accounts are in your name from day one.',
  },
  { title: 'Two rounds of design changes', text: 'Two rounds of changes on the design are included in the price.' },
  { title: '30 days of free fixes', text: 'For 30 days after launch, we fix any bug in what we built, free.' },
  {
    title: 'Support if you want it',
    text: "Monthly care for websites and apps, optional. Cancel any time with 30 days' notice.",
  },
  {
    title: 'No hidden costs',
    text: 'Hosting, domains, AI and API usage and app store fees are paid by you directly, at cost.',
  },
  {
    title: 'SEO month to month',
    text: "No long contract: cancel with 30 days' notice. Nobody can guarantee rankings, so we don't.",
  },
];

/** The four that matter most before a first call, said short. */
export const keyTerms: Term[] = [
  { title: 'A fixed price, in writing.', text: 'Agreed before any work starts.' },
  { title: 'Pay in stages.', text: 'Half to start, half at launch.' },
  { title: 'Everything is yours.', text: 'Code, designs and accounts, in your name.' },
  { title: '30 days of free fixes.', text: 'Any bug after launch, fixed at no cost.' },
];

/** Where the full agreement lives. */
export const termsUrl = '/how-we-work#terms';
