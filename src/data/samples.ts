import type { Seed } from './projects';
import sampleOrderBot from '../assets/work/samples/order-bot.png';
import sampleCampusApp from '../assets/work/samples/campus-app.png';
import sampleClinic from '../assets/work/samples/clinic-dashboard.png';
import sampleDanceClub from '../assets/work/samples/dance-club.png';

/**
 * SAMPLES, NOT REAL WORK. They fill the Work page on localhost (`astro dev`) so the layout can be
 * judged while the real bots, the college app and the rest are on their way. Production builds
 * never include them. Replace each one with a real project, then delete this list.
 */
export const samples: Seed[] = [
  {
    slug: 'sample-order-bot',
    kind: 'Telegram bot',
    name: 'Burger Spot bot',
    services: ['Telegram Bots & Extensions'],
    plain: 'Takes food orders and payments right in Telegram.',
    summary: 'A Telegram bot with the menu, a cart, payment and pick-up times, and an admin panel for the kitchen.',
    image: { src: sampleOrderBot, alt: 'Sample: a Telegram chat with a burger order and payment' },
  },
  {
    slug: 'sample-campus-app',
    kind: 'Mobile app',
    name: 'Campus app',
    services: ['Mobile & Desktop Apps'],
    plain: 'Schedule, grades and news for a college, on the phone.',
    summary: 'An iOS and Android app with the day’s classes, grades by semester and news from the office.',
    image: { src: sampleCampusApp, alt: 'Sample: three phone screens with a class schedule, grades and news' },
  },
  {
    slug: 'sample-clinic',
    kind: 'Web app',
    name: 'Smile Studio bookings',
    services: ['Web Apps & SaaS'],
    plain: 'Online bookings and reminders for a dental clinic.',
    summary: 'A booking calendar for a dental clinic, with patient records, reminders and a daily overview.',
    image: { src: sampleClinic, alt: 'Sample: a clinic dashboard with bookings by day and the next appointments' },
  },
  {
    slug: 'sample-dance-club',
    kind: 'Website',
    name: 'Pulse dance club',
    services: ['Websites & Landing Pages'],
    plain: 'A site for a dance club: styles, classes and sign-up.',
    summary: 'A multi-page site for a dance club: dance styles, about, blog, gallery and a sign-up form.',
    image: { src: sampleDanceClub, alt: 'Sample: the dance club home page with a class photo' },
  },
];
