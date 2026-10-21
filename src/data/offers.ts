// Offer pages under /services/<slug>: one page each for the kinds of project that competing studios
// do not sell with a page of their own. Rendered by src/pages/services/[offer].astro, linked from the
// Services blocks and listed in llms.txt. No prices here (owner's decision, 2026-10-20): every
// project is priced after a call. Steps and promises follow the terms on the Services page.

import type { Look } from './projects';
import type { Service } from './site';

export type OfferItem = { title: string; text: string };
export type OfferFaq = { question: string; answer: string };

export type Offer = {
  slug: string;
  /** Short name for links and breadcrumbs: "Telegram bots". */
  name: string;
  /** Page title before " · Launchery Studio"; also the Service name in JSON-LD. */
  title: string;
  description: string;
  /** The h1: `lead` in plain type, `mark` in the teal highlight box (keep it to a few words). */
  h1: { lead: string; mark: string };
  lede: string;
  /** The Services block this page belongs to; also ticked in the call request form. */
  service: Service;
  /** Share image tint. */
  tone: Look['tone'];
  /** The illustration next to the title (src/components/OfferStage.astro). */
  stage: 'bot' | 'mini-app' | 'extension' | 'desktop';
  examples: { title: string; intro: string; items: OfferItem[] };
  deliverables: { intro: string; items: string[] };
  steps: { intro: string; items: OfferItem[] };
  faqs: { title: string; items: OfferFaq[] };
  cta: { title: string; text: string };
};

const callStep = (topic: string): OfferItem => ({
  title: 'A free call',
  text: `30 minutes on ${topic}. You leave with a clear next step.`,
});
const priceStep: OfferItem = {
  title: 'A fixed price in writing',
  text: 'Within two business days you get our approach, the scope and a fixed price. Nothing starts until you agree.',
};
const priceAnswer = (thing: string) =>
  `It depends on what ${thing} has to do and what it connects to, so every project is priced on its own. After a free 30-minute call you get a fixed price for a written scope within two business days, before you commit to anything.`;

export const offers: Offer[] = [
  {
    slug: 'telegram-bots',
    name: 'Telegram bots',
    title: 'Telegram Bot Development',
    description:
      'We design and build Telegram bots that take orders and payments, book appointments, answer customers and run workflows, with the admin panel and integrations behind them.',
    h1: { lead: 'Telegram bots that do', mark: 'real work.' },
    lede: 'Bots that take orders and payments, book appointments, answer customers and run your workflows right in Telegram. We design the conversation, build the bot and the admin panel behind it, and launch it.',
    service: 'Telegram Bots & Extensions',
    tone: 'cyan',
    stage: 'bot',
    examples: {
      title: 'Bots we build.',
      intro: 'A bot serves people where they already chat: no app to install and no website to find.',
      items: [
        {
          title: 'Orders and payments',
          text: 'A menu or catalog in the chat, a cart and checkout without leaving Telegram. New orders reach your team the moment they come in.',
        },
        {
          title: 'Bookings and reminders',
          text: 'Clients pick a service and a time, and pay a deposit if you ask for one. Reminders go out before the visit, and your calendar stays in sync.',
        },
        {
          title: 'Customer support',
          text: 'Instant answers to the common questions and a hand-off to a person when it matters. Optional AI answers drawn from your own documents.',
        },
        {
          title: 'Leads and sign-ups',
          text: 'A few questions to qualify each lead, contacts collected with consent and sent straight to your CRM or a spreadsheet.',
        },
        {
          title: 'Communities and channels',
          text: 'Paid access to private channels and groups, welcome flows, moderation and posts that go out on schedule.',
        },
        {
          title: 'Team bots',
          text: 'Alerts from your systems, approvals in one tap and daily reports, sent to the people who need them.',
        },
      ],
    },
    deliverables: {
      intro: 'A working bot, the tools to run it, and everything in your name.',
      items: [
        'Conversation design: commands, menus, buttons and every reply written',
        'The bot, built on the official Telegram Bot API',
        'An admin panel for orders, users, content and broadcasts',
        "Payments through Telegram's payment providers or Telegram Stars",
        'Integrations with your CRM, calendar, spreadsheets or own systems',
        'Several languages, if your audience needs them',
        'Hosting in your name, with monitoring and backups',
        'The bot on your own Telegram account and the code in your repository',
      ],
    },
    steps: {
      intro: 'A fixed price before any work starts, and a bot you can try in Telegram long before launch.',
      items: [
        callStep('what the bot should do, who will use it and what it connects to'),
        priceStep,
        {
          title: 'The conversation, designed',
          text: 'Every command, button and reply is mapped and written before the code. Two rounds of changes are included.',
        },
        {
          title: 'Built, with a test bot',
          text: 'You get a private test bot early and try each part as it is ready, in your own Telegram.',
        },
        {
          title: 'Launch and 30 days of fixes',
          text: 'We go live, watch the first real conversations and fix any bug in what we built for 30 days, free.',
        },
      ],
    },
    faqs: {
      title: 'Questions about Telegram bots.',
      items: [
        { question: 'How much does a Telegram bot cost?', answer: priceAnswer('the bot') },
        {
          question: 'How long does it take to build a Telegram bot?',
          answer:
            'A bot with one clear job usually takes a few weeks. Payments, an admin panel and several integrations add time. You get a timeline together with the fixed price.',
        },
        {
          question: 'Can a Telegram bot accept payments?',
          answer:
            "Yes. Physical goods and services are paid by card through Telegram's payment providers, and digital goods through Telegram Stars, as Telegram requires. We set up the one that fits what you sell.",
        },
        {
          question: 'Can the bot answer with AI?',
          answer:
            'Yes. The bot can answer from your own documents, prices and policies with an AI model, within limits you set, and pass the chat to a person when it should. The AI provider bills its usage to you directly, at cost.',
        },
        {
          question: 'Can a bot work in groups and channels?',
          answer:
            'Yes. Bots can welcome new members, moderate, post on a schedule and manage paid access to private channels and groups.',
        },
        {
          question: 'Who owns the bot?',
          answer:
            'You do. The bot and its hosting are in your name from day one, and the code and the admin panel are yours once the final payment is made.',
        },
      ],
    },
    cta: {
      title: 'Have a bot in mind?',
      text: 'A free 30-minute call about what it should do. A fixed price follows in writing within two business days.',
    },
  },
  {
    slug: 'telegram-mini-apps',
    name: 'Telegram Mini Apps',
    title: 'Telegram Mini App Development',
    description:
      'We design and build Telegram Mini Apps: stores, booking, loyalty cards and team tools that open inside Telegram in one tap, with sign-in and payments built in.',
    h1: { lead: 'Telegram Mini Apps that open', mark: 'in one tap.' },
    lede: 'A Mini App is a full app that opens inside Telegram. Nothing to install, no sign-up form, payments in the chat. We design it, build it with the bot and the backend behind it, and launch it.',
    service: 'Telegram Bots & Extensions',
    tone: 'blue',
    stage: 'mini-app',
    examples: {
      title: 'Mini Apps we build.',
      intro: 'Anything that works better on a screen than in chat messages: browsing, choosing, paying, tracking.',
      items: [
        {
          title: 'Stores and catalogs',
          text: 'Products with photos and filters, a cart and checkout, all without leaving Telegram.',
        },
        {
          title: 'Booking and appointments',
          text: 'A calendar with real availability, services and staff to choose from, and reminders sent by the bot.',
        },
        {
          title: 'Loyalty and membership',
          text: 'A digital card with points, rewards and a code to show at the counter, always one tap away in the chat.',
        },
        {
          title: 'Personal accounts',
          text: 'Orders, subscriptions, balances and settings: the account area of your product, inside Telegram.',
        },
        {
          title: 'Games and campaigns',
          text: 'Quizzes, simple games, contests and referral campaigns that people share in their own chats.',
        },
        {
          title: 'Team tools',
          text: 'Forms, checklists, approvals and stock counts for your team, on the phone they already carry.',
        },
      ],
    },
    deliverables: {
      intro: 'A Mini App people can use from day one, the bot that opens it, and the system behind both.',
      items: [
        "Design of every screen, in Telegram's light and dark themes",
        "The Mini App, built on Telegram's official Mini Apps platform",
        'Users signed in with their Telegram account, verified on the server',
        'The bot that opens it from a menu button, a link or a message',
        "Payments through Telegram's payment providers or Telegram Stars",
        'A backend and admin panel for products, orders, users and content',
        'Hosting in your name, with monitoring and backups',
        'Web code you can reuse for a website or web app later',
      ],
    },
    steps: {
      intro: 'A fixed price before any work starts, and a Mini App you can open in your own Telegram while it is built.',
      items: [
        callStep('what the Mini App should do, who opens it and what it connects to'),
        priceStep,
        {
          title: 'Screens, designed',
          text: "Every screen designed for phones first, in Telegram's light and dark themes. Two rounds of changes are included.",
        },
        {
          title: 'Built, with a test link',
          text: 'You get a private link that opens the Mini App in your own Telegram, and try each part as it is ready.',
        },
        {
          title: 'Launch and 30 days of fixes',
          text: 'We go live, watch the first real users and fix any bug in what we built for 30 days, free.',
        },
      ],
    },
    faqs: {
      title: 'Questions about Mini Apps.',
      items: [
        {
          question: 'What is a Telegram Mini App?',
          answer:
            'A web app that opens inside Telegram, over the chat or full screen. It looks and works like an app, but there is nothing to install: people open it from a bot, a link or a button in a message.',
        },
        {
          question: 'Do I need a Mini App or a bot?',
          answer:
            'A bot is enough when the job fits a few messages and buttons. Choose a Mini App when people need to browse, compare, fill a cart or pick a time on a calendar. Many projects use both: the bot for messages and reminders, the Mini App for the screens.',
        },
        { question: 'How much does a Telegram Mini App cost?', answer: priceAnswer('the Mini App') },
        {
          question: 'Do users have to sign up?',
          answer:
            'No. Telegram passes the user to the Mini App when it opens and we verify it on the server, so people are signed in from the first tap. You can still ask for a phone number or an email when you need one.',
        },
        {
          question: 'Can a Mini App take payments?',
          answer:
            "Yes. Physical goods and services are paid by card through Telegram's payment providers, and digital goods through Telegram Stars, as Telegram requires.",
        },
        {
          question: 'Who owns the Mini App?',
          answer:
            'You do. The bot and the hosting are in your name from day one, and the code and the admin panel are yours once the final payment is made.',
        },
      ],
    },
    cta: {
      title: 'Have a Mini App in mind?',
      text: 'A free 30-minute call about what it should do. A fixed price follows in writing within two business days.',
    },
  },
  {
    slug: 'browser-extensions',
    name: 'Browser extensions',
    title: 'Browser Extension Development',
    description:
      'We design and build browser extensions for Chrome, Firefox and Edge that bring your product into the pages people already use, and publish them to each store.',
    h1: { lead: 'Browser extensions people', mark: 'keep pinned.' },
    lede: 'Extensions for Chrome, Firefox and Edge that bring your product into the pages people already work in. We design them, build them on Manifest V3, connect them to your product and see them through store review.',
    service: 'Telegram Bots & Extensions',
    tone: 'violet',
    stage: 'extension',
    examples: {
      title: 'Extensions we build.',
      intro: 'An extension earns its place in the toolbar by saving a step people repeat every day.',
      items: [
        {
          title: 'Companions to your product',
          text: 'Your SaaS one click away: save, look up or create things in your product from any page, signed in with the same account.',
        },
        {
          title: 'Clippers and savers',
          text: 'Save pages, text, images or contacts into your tool, with tags and notes added on the spot.',
        },
        {
          title: 'AI helpers',
          text: 'Summarize a page, draft a reply or fill in a field with AI, with the user deciding what gets sent.',
        },
        {
          title: 'Side panels',
          text: "A panel next to the page that shows your product's data about what the user is looking at.",
        },
        {
          title: 'On-page tools',
          text: 'A button, a badge or extra data placed right on a website your users visit, exactly where they need it.',
        },
        {
          title: 'Team tools',
          text: 'Extensions that fill forms and check data against your systems, installed for your team only, with no public listing.',
        },
      ],
    },
    deliverables: {
      intro: 'An extension ready for the stores, and the accounts to keep shipping it.',
      items: [
        'Design of the popup, side panel, settings and onboarding',
        'The extension, built on Manifest V3',
        'One codebase for Chrome, Edge and Firefox, with the differences handled',
        "Sign-in and sync with your product's accounts",
        'Only the permissions it needs, which helps store review and user trust',
        'Store listings: descriptions, screenshots and the privacy details each store asks for',
        'Publishing to the Chrome Web Store, Firefox Add-ons and Microsoft Edge Add-ons',
        'Developer accounts in your name, and updates shipped through the stores',
      ],
    },
    steps: {
      intro: 'A fixed price before any work starts, and test builds in your own browser while it is built.',
      items: [
        callStep('what the extension should do, on which sites and for whom'),
        priceStep,
        {
          title: 'The flow, designed',
          text: 'Popup, panel and onboarding designed around the one task the extension does best. Two rounds of changes are included.',
        },
        {
          title: 'Built, with test builds',
          text: 'You install test builds in your own browser and try each part as it is ready.',
        },
        {
          title: 'Store review and launch',
          text: 'We prepare the listings, submit to each store and answer the reviewers. Then 30 days of free fixes.',
        },
      ],
    },
    faqs: {
      title: 'Questions about browser extensions.',
      items: [
        {
          question: 'Which browsers do you build for?',
          answer:
            'Chrome, Firefox and Edge, from one codebase. Brave and Vivaldi install extensions from the Chrome Web Store too, so your users there are covered.',
        },
        { question: 'How much does a browser extension cost?', answer: priceAnswer('the extension') },
        {
          question: 'How long does store review take?',
          answer:
            "Usually days rather than weeks, though a first submission or broad permissions can take longer. We plan the launch date around it and answer the reviewers' questions.",
        },
        {
          question: 'What is Manifest V3?',
          answer:
            'The current format for browser extensions. Chrome has phased out extensions built on the older Manifest V2, so anything new should be built on V3. We build on it from the start.',
        },
        {
          question: 'Can the extension work with our product?',
          answer:
            "Yes. It signs in with the same accounts and talks to your product's API. If there is no API yet, we can build the part the extension needs.",
        },
        {
          question: 'Who owns the extension?',
          answer:
            'You do. It is published from your own developer accounts, and the code is yours once the final payment is made.',
        },
      ],
    },
    cta: {
      title: 'Have an extension in mind?',
      text: 'A free 30-minute call about what it should do. A fixed price follows in writing within two business days.',
    },
  },
  {
    slug: 'desktop-apps',
    name: 'Desktop apps',
    title: 'Desktop App Development',
    description:
      'We design and build desktop apps for Windows, macOS and Linux: team tools, companions to your web product and apps that work offline, signed and updating themselves.',
    h1: { lead: 'Desktop apps people', mark: 'open every day.' },
    lede: 'Apps for Windows, macOS and Linux, for the work that belongs on a computer: local files, offline use, many windows, all day long. We design them, build them, sign them and set up updates that install themselves.',
    service: 'Mobile & Desktop Apps',
    tone: 'cyan',
    stage: 'desktop',
    examples: {
      title: 'Desktop apps we build.',
      intro: 'Desktop is the better home when people work with files, need to work offline or keep an app open all day.',
      items: [
        {
          title: 'Team tools',
          text: 'Apps your team keeps open all day for orders, stock, documents or support, with a keyboard shortcut for every common step.',
        },
        {
          title: 'Companions to your web product',
          text: 'A desktop version of your SaaS with system notifications, a menu bar or tray icon and sign-in with the same account.',
        },
        {
          title: 'Offline-first apps',
          text: 'Work without a connection and sync when it comes back, for field teams, shops and anywhere the network is unreliable.',
        },
        {
          title: 'File and media tools',
          text: 'Apps that open, convert, organize or process files on the computer, from documents to images and video.',
        },
        {
          title: 'AI on the desktop',
          text: "Assistants that work with the user's own files, with clear control over what leaves the computer.",
        },
        {
          title: 'Menu bar and tray utilities',
          text: 'Small tools that are always one click away: quick capture, uploads, timers and status at a glance.',
        },
      ],
    },
    deliverables: {
      intro: 'An app people can install without warnings, and that keeps itself up to date.',
      items: [
        "Design of every window, menu and dialog, following each system's conventions",
        'Versions for Windows, macOS and Linux, or only the systems you need',
        'Signed installers for each system, with Apple notarization for macOS',
        'Automatic updates, so every user runs the latest version',
        'Offline storage and sync with your server, when the app needs it',
        'Crash reports and error monitoring',
        'Help publishing to the Microsoft Store and the Mac App Store, or downloads from your site',
        'Developer accounts and signing certificates in your name',
      ],
    },
    steps: {
      intro: 'A fixed price before any work starts, and test builds on your own computers while it is built.',
      items: [
        callStep('what the app should do, who uses it and on which systems'),
        priceStep,
        {
          title: 'Windows and flows, designed',
          text: 'Every window and the paths between them, designed before the code. Two rounds of changes are included.',
        },
        {
          title: 'Built, with test builds',
          text: 'You install test builds on your own computers and try each part as it is ready.',
        },
        {
          title: 'Signed, shipped, fixed',
          text: 'We sign the installers, publish them where you want them and fix any bug in what we built for 30 days, free.',
        },
      ],
    },
    faqs: {
      title: 'Questions about desktop apps.',
      items: [
        {
          question: 'Why a desktop app and not a web app?',
          answer:
            'Choose desktop when people work with local files, need to work offline, rely on keyboard shortcuts or keep the app open all day. If a browser does the job, we will tell you: a web app is often the better place to start.',
        },
        {
          question: 'Which systems do you build for?',
          answer: 'Windows, macOS and Linux. You can start with one system and add the others later.',
        },
        { question: 'How much does a desktop app cost?', answer: priceAnswer('the app') },
        {
          question: 'What is code signing, and do I need it?',
          answer:
            'Signing proves to Windows and macOS that the app comes from you and has not been changed. Without it, users see security warnings and macOS may refuse to open the app. We set up signing and Apple notarization in your name.',
        },
        {
          question: 'How do updates reach users?',
          answer:
            'The app checks for updates and installs them itself, so a fix you ship once reaches every user. Store versions update through the store.',
        },
        {
          question: 'Who owns the app?',
          answer:
            'You do. Developer accounts and signing certificates are in your name from day one, and the code is yours once the final payment is made.',
        },
      ],
    },
    cta: {
      title: 'Have a desktop app in mind?',
      text: 'A free 30-minute call about what it should do. A fixed price follows in writing within two business days.',
    },
  },
];

export const offerUrl = (offer: Pick<Offer, 'slug'>) => `/services/${offer.slug}`;

/** Offer pages that belong to a Services block, for its links. */
export const offersFor = (service: Service) => offers.filter((offer) => offer.service === service);
