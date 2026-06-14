/**
 * Shared homepage CMS default structure for backend seeding.
 * Mirrors frontend-public/src/data/cmsDefaults.js shape.
 */

export const DEFAULT_HERO_SLIDES = [
  {
    id: 1,
    sortOrder: 0,
    visible: true,
    eyebrow: 'Kanaighat, Sylhet · Bangladesh travel desk',
    title: 'International flights, visas & packages — booked from Sylhet',
    subtitle:
      'Show Terra Flight is a full-service travel desk in Kanaighat. Clear BDT pricing, WhatsApp support, and a team you can visit in person.',
    primaryCtaText: 'Book Your Ticket',
    primaryCtaLink: '/booking',
    secondaryCtaText: 'Explore Packages',
    secondaryCtaLink: '#packages',
    image: '/images/home/hero.svg',
    mobileImage: '',
    overlayOpacity: 0.88,
    textAlign: 'left',
    badge: 'Trusted since 2014',
    trustPoints: [
      'Physical desk at Gasbari Bazar — not an anonymous website',
      'Gulf, Southeast Asia, UK & Canada routes',
    ],
  },
  {
    id: 2,
    sortOrder: 1,
    visible: true,
    eyebrow: 'Umrah & spiritual travel',
    title: 'Umrah packages with flights, visa & Makkah hotels',
    subtitle:
      'Group and private Umrah from Dhaka and Sylhet — visa filing, ground transport, and coordinator support on departure day.',
    primaryCtaText: 'Plan Umrah',
    primaryCtaLink: '/booking',
    secondaryCtaText: 'Talk on WhatsApp',
    secondaryCtaLink: 'whatsapp',
    image: '/images/home/promo.svg',
    mobileImage: '',
    overlayOpacity: 0.9,
    textAlign: 'left',
    badge: 'Ramadan departures open',
    trustPoints: ['Makkah & Madinah hotel partners', 'Document-checked visa files'],
  },
  {
    id: 3,
    sortOrder: 2,
    visible: true,
    eyebrow: 'Holiday packages',
    title: 'Dubai, Thailand & Malaysia — flights, hotel & pickup',
    subtitle:
      'Fixed BDT package prices for families. Custom dates and room upgrades available on request from our Sylhet office.',
    primaryCtaText: 'Get a Quote',
    primaryCtaLink: '/contact',
    secondaryCtaText: 'View Packages',
    secondaryCtaLink: '#packages',
    image: '/images/home/destination.svg',
    mobileImage: '',
    overlayOpacity: 0.86,
    textAlign: 'left',
    badge: 'Best value packages',
    trustPoints: ['Airport pickup included', 'Pay via bank, bKash, Nagad or cash'],
  },
];

export const DEFAULT_EXPLORE_LINKS = [
  { id: 'hero', label: 'Home', href: '/#hero', visible: true, sortOrder: 0 },
  { id: 'services', label: 'Services', href: '/#services', visible: true, sortOrder: 1 },
  { id: 'packages', label: 'Packages', href: '/#packages', visible: true, sortOrder: 2 },
  { id: 'about', label: 'About', href: '/#about', visible: true, sortOrder: 3 },
  { id: 'gallery', label: 'Gallery', href: '/#gallery', visible: true, sortOrder: 4 },
  { id: 'team', label: 'Team', href: '/#team', visible: true, sortOrder: 5 },
  { id: 'contact', label: 'Contact', href: '/#contact', visible: true, sortOrder: 6 },
  { id: 'faq', label: 'FAQ', href: '/faq', visible: true, sortOrder: 7 },
];

export const DEFAULT_PAYMENT_METHODS = [
  { id: 'bank', label: 'Bank', abbr: 'BK', accent: '', visible: true, sortOrder: 0 },
  { id: 'bkash', label: 'bKash', abbr: 'bK', accent: 'text-[#e2136e]', visible: true, sortOrder: 1 },
  { id: 'nagad', label: 'Nagad', abbr: 'Ng', accent: 'text-[#f69220]', visible: true, sortOrder: 2 },
  { id: 'cash', label: 'Cash', abbr: 'Tk', accent: '', visible: true, sortOrder: 3 },
];

export function buildDefaultHomeContent() {
  return {
    sections: {
      hero: {
        visible: true,
        autoplayMs: 6000,
        showQuickQuote: true,
        quickQuoteTitle: 'Tell us where you want to go',
        quickQuoteSubtitle: 'We reply on WhatsApp with fare options and package pricing in BDT',
        slides: DEFAULT_HERO_SLIDES,
        credibility: [
          { value: '10+ yrs', label: 'Serving Sylhet travelers' },
          { value: '15+', label: 'International destinations' },
          { value: '1,000+', label: 'Tickets & packages booked' },
          { value: '2–4 hrs', label: 'Typical WhatsApp response' },
        ],
      },
      promo: { visible: true, eyebrow: 'Current offers', title: 'Seasonal deals for Bangladesh travelers', subtitle: '', slides: [] },
      services: { visible: true, eyebrow: 'Our services', title: 'Everything you need to travel abroad', subtitle: '', items: [] },
      packages: { visible: true, eyebrow: 'Tour packages', title: 'Real offers departing from Bangladesh', subtitle: '', items: [] },
      worldMap: { visible: true, eyebrow: 'From Sylhet to the world', title: 'From Kanaighat to Jeddah, Dubai, Kuala Lumpur & beyond', subtitle: '', destinations: [], stats: [] },
      about: { visible: true, eyebrow: 'About us', title: 'A Sylhet travel agency with nationwide reach', lead: '', body: '', image: '/images/home/office.svg', imageCaption: 'Your local international travel desk', imageLocation: 'Kanaighat, Sylhet' },
      testimonials: { visible: true, eyebrow: 'Client reviews', title: 'Trusted by travelers across Sylhet & Dhaka', subtitle: '', items: [] },
      gallery: { visible: true, eyebrow: 'Travel gallery', title: 'Snapshots from our client trips', subtitle: '', filters: [], items: [] },
      team: { visible: true, eyebrow: 'Our team', title: 'Consultants who know Bangladesh travel inside out', subtitle: '', items: [] },
      trust: { visible: true, eyebrow: 'Why book with us', title: 'A Sylhet travel desk you can visit in person', subtitle: '', items: [], assurances: [], payments: [], stats: [] },
      paymentStrip: { visible: true, label: 'Pay via', supportSubline: 'Booking help 7 days a week', methods: DEFAULT_PAYMENT_METHODS },
      cta: { visible: true, eyebrow: 'Start your booking', title: 'Ready to book your next trip from Bangladesh?', subtitle: '', primaryCtaText: 'Talk on WhatsApp', primaryCtaLink: 'whatsapp', secondaryCtaText: 'Call Now', secondaryCtaLink: 'tel', tertiaryCtaText: 'Plan Your Trip', tertiaryCtaLink: '/booking', image: '/images/home/sky.svg' },
      contact: { visible: true, eyebrow: 'Contact', title: 'Visit our Sylhet office or message us', subtitle: 'Walk in during business hours or reach us anytime on WhatsApp for travel quotes.', officeTitle: 'Office', officeHeading: 'Kanaighat, Sylhet', directLineTitle: 'Direct line', directLineHeading: 'Phone & email', nextStepTitle: 'Next step', nextStepHeading: 'Start your booking', nextStepBody: 'Tell us your route and dates — we reply with fare options and package pricing in BDT.', whatsappButtonText: 'Message on WhatsApp' },
      footer: {
        visible: true,
        tagline: 'International air tickets, visa processing, Umrah packages, and holiday tours from our Kanaighat, Sylhet office — with WhatsApp support and local payment options.',
        supportNote: 'WhatsApp replies typically within 2–4 hours on business days',
        ctaText: 'Book Your Ticket',
        ctaLink: '/booking',
        exploreTitle: 'Explore',
        servicesTitle: 'Services',
        contactTitle: 'Contact',
        copyrightText: 'All rights reserved.',
        legalText: '',
        locationLine: 'Gasbari Bazar, Kanaighat, Sylhet, Bangladesh',
        exploreLinks: DEFAULT_EXPLORE_LINKS,
        paymentMethods: DEFAULT_PAYMENT_METHODS,
        showPaymentStrip: true,
      },
    },
    supportReassurance: {
      response: 'WhatsApp replies typically within 2–4 hours on business days',
      hours: 'Office Sun–Thu 9:00am–8:00pm · Sat 10:00am–6:00pm',
      booking: 'We confirm seat availability and total BDT price before you pay',
    },
  };
}

export default buildDefaultHomeContent;
