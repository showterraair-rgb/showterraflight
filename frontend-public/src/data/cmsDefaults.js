import { HOME_IMAGE_FALLBACKS } from '../utils/imageUtils';

/** Default 3 hero slides — seeded in backend and used as client fallbacks */
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
    image: HOME_IMAGE_FALLBACKS.hero,
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
    image: HOME_IMAGE_FALLBACKS.promo,
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
    image: HOME_IMAGE_FALLBACKS.destination,
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

export const DEFAULT_PAYMENT_STRIP = {
  visible: true,
  label: 'Pay via',
  supportSubline: 'Booking help 7 days a week',
  methods: [
    { id: 'bank', label: 'Bank', abbr: 'BK', accent: '', visible: true, sortOrder: 0 },
    { id: 'bkash', label: 'bKash', abbr: 'bK', accent: 'text-[#e2136e]', visible: true, sortOrder: 1 },
    { id: 'nagad', label: 'Nagad', abbr: 'Ng', accent: 'text-[#f69220]', visible: true, sortOrder: 2 },
    { id: 'cash', label: 'Cash', abbr: 'Tk', accent: '', visible: true, sortOrder: 3 },
  ],
};

export const DEFAULT_FOOTER = {
  visible: true,
  logoAlt: 'Show Terra Flight',
  tagline:
    'International air tickets, visa processing, Umrah packages, and holiday tours from our Kanaighat, Sylhet office — with WhatsApp support and local payment options.',
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
  paymentMethods: DEFAULT_PAYMENT_STRIP.methods,
  showPaymentStrip: true,
};

export default {
  DEFAULT_HERO_SLIDES,
  DEFAULT_EXPLORE_LINKS,
  DEFAULT_PAYMENT_STRIP,
  DEFAULT_FOOTER,
};
