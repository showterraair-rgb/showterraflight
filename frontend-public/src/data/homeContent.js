/** Static homepage content — defaults when CMS is empty */

import { HOME_IMAGE_FALLBACKS } from '../utils/imageUtils';

export const BRAND_NAME = 'Show Terra Flight';
/** Safe defaults when API/CMS company data is missing or partial */
export const DEFAULT_COMPANY = {
  name: 'Show Terra Flight',
  address: 'GASBARI BAZAR, GROUND FLOOR OF BRAC BANK, KANAIGHAT, SYLHET-3183, Bangladesh',
  email: 'showterraair@gmail.com',
  whatsapp: '01741148529',
  directorName: 'Kamil Hussen',
  directorPhone: '01316160206',
  ownerEmail: 'k.h.kamil74@gmail.com',
  currency: 'BDT',
  timezone: 'Asia/Dhaka',
};

export const NAV_SECTIONS = [
  { id: 'hero', label: 'Home' },
  { id: 'services', label: 'Services' },
  { id: 'packages', label: 'Packages' },
  { id: 'about', label: 'About' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'team', label: 'Team' },
  { id: 'contact', label: 'Contact' },
];

export const SERVICES = [
  {
    id: 'air-ticket',
    title: 'Air Ticket Booking',
    description:
      'Economy and business class on Biman, Emirates, Saudia, AirAsia, and more — quoted in BDT with PNR before you pay.',
    icon: 'plane',
  },
  {
    id: 'visa',
    title: 'Visa Processing',
    description:
      'UAE, Malaysia, Thailand, Schengen, and UK visit visas — we prepare your file, submit, and track until stamping.',
    icon: 'visa',
  },
  {
    id: 'tour',
    title: 'Tour Packages',
    description:
      'Dubai, Thailand, Malaysia, and Singapore itineraries with flights, hotels, transfers, and local coordination.',
    icon: 'tour',
  },
  {
    id: 'hotel',
    title: 'Hotel Booking',
    description:
      'Hotels in Makkah, Madinah, Dubai, KL, and Bangkok matched to your dates — booked alongside your ticket or package.',
    icon: 'hotel',
  },
  {
    id: 'umrah',
    title: 'Umrah / Hajj',
    description:
      'Group and private Umrah with visa, flights, Makkah & Madinah hotels, transport, and a coordinator on departure day.',
    icon: 'umrah',
  },
  {
    id: 'corporate',
    title: 'Corporate Travel',
    description:
      'Repeat ticketing and visa support for Sylhet and Dhaka businesses — monthly statements and priority rebooking.',
    icon: 'corporate',
  },
];

export const PROMO_SLIDES = [
  {
    id: 1,
    tag: 'Umrah season',
    title: 'Umrah packages — Dhaka & Sylhet departures',
    subtitle: 'Flights, visa, Makkah & Madinah hotels, and airport transfers. Group sizes from 10 to 40 pilgrims.',
    cta: 'Explore Packages',
    href: '#packages',
    image: '/images/home/promo.svg',
    accent: 'from-emerald-700/92 to-teal-900/92',
  },
  {
    id: 2,
    tag: 'Visa desk',
    title: 'UAE & Malaysia visa filing from Sylhet',
    subtitle: 'Walk in with your passport and bank statements — we check everything before embassy submission.',
    cta: 'Plan Your Trip',
    href: '/contact',
    image: '/images/home/hero.svg',
    accent: 'from-brand-800/92 to-brand-950/92',
  },
  {
    id: 3,
    tag: 'Holiday packages',
    title: 'Dubai & Thailand — flights, hotel & pickup included',
    subtitle: 'Fixed BDT package prices for families. Custom dates and room upgrades available on request.',
    cta: 'Explore Packages',
    href: '#packages',
    image: '/images/home/destination.svg',
    accent: 'from-amber-700/90 to-orange-900/92',
  },
  {
    id: 4,
    tag: 'Air fares',
    title: 'Jeddah, Dubai, London & Toronto — compare fares today',
    subtitle: 'Multiple airlines and date options quoted on WhatsApp. PNR held before you transfer payment.',
    cta: 'Book Your Ticket',
    href: '/booking',
    image: '/images/home/sky.svg',
    accent: 'from-sky-800/92 to-brand-950/92',
  },
];

export const PACKAGES = [
  {
    id: 'dubai',
    destination: 'Dubai, UAE',
    duration: '4 Days / 3 Nights',
    departFrom: 'Dhaka (DAC) or Sylhet (ZYL)',
    price: '৳45,000',
    priceLabel: 'Starting from',
    priceNote: 'per person · twin share',
    seasonNote: 'Winter departures · subject to seat availability',
    image: '/images/home/destination.svg',
    features: ['Return economy flights', '4★ hotel near Deira', 'Airport pickup & drop', 'Half-day Dubai city tour'],
    badge: 'Popular',
  },
  {
    id: 'malaysia',
    destination: 'Kuala Lumpur, Malaysia',
    duration: '5 Days / 4 Nights',
    departFrom: 'Dhaka (DAC)',
    price: '৳52,000',
    priceLabel: 'Starting from',
    priceNote: 'per person · twin share',
    seasonNote: 'Includes daily breakfast',
    image: '/images/home/destination.svg',
    features: ['Return flights with baggage', 'KL city-centre hotel', 'Genting Highlands day trip', 'Tourist visa filing support'],
    badge: 'Family pick',
  },
  {
    id: 'thailand',
    destination: 'Bangkok & Pattaya',
    duration: '6 Days / 5 Nights',
    departFrom: 'Dhaka (DAC)',
    price: '৳48,500',
    priceLabel: 'Starting from',
    priceNote: 'per person · twin share',
    seasonNote: 'Beach extension available on request',
    image: '/images/home/destination.svg',
    features: ['Return flights', 'Pattaya beachfront hotel', 'Coral island tour', 'English-speaking local guide'],
    badge: 'Best value',
  },
  {
    id: 'saudi',
    destination: 'Umrah — Saudi Arabia',
    duration: '10 Days / 9 Nights',
    departFrom: 'Dhaka or Sylhet group departures',
    price: '৳1,25,000',
    priceLabel: 'Packages from',
    priceNote: 'per pilgrim · quad share',
    seasonNote: 'Ramadan & post-Ramadan slots — book early',
    image: '/images/home/promo.svg',
    features: ['Return flights + Umrah visa', 'Makkah hotel walking distance', 'Madinah stay included', 'Ziyarat & ground transport'],
    badge: 'Spiritual',
  },
  {
    id: 'singapore',
    destination: 'Singapore',
    duration: '4 Days / 3 Nights',
    departFrom: 'Dhaka (DAC)',
    price: '৳58,000',
    priceLabel: 'Starting from',
    priceNote: 'per person · twin share',
    seasonNote: 'School-holiday dates fill quickly',
    image: '/images/home/destination.svg',
    features: ['Return flights', 'Bugis / Marina hotel', 'Sentosa day pass', 'EZ-Link metro card'],
    badge: 'Trending',
  },
  {
    id: 'turkey',
    destination: 'Istanbul, Turkey',
    duration: '7 Days / 6 Nights',
    departFrom: 'Dhaka via connecting hub',
    price: '৳89,000',
    priceLabel: 'Starting from',
    priceNote: 'per person · twin share',
    seasonNote: 'Visa appointment assistance included',
    image: '/images/home/destination.svg',
    features: ['Return flights', 'Sultanahmet boutique hotel', 'Bosphorus dinner cruise', 'Old city guided walk'],
    badge: 'Premium',
  },
];

export const WORLD_DESTINATIONS = [
  { id: 'sa', label: 'Saudi Arabia', short: 'Saudi', x: 42, y: 38 },
  { id: 'uae', label: 'UAE', short: 'UAE', x: 48, y: 42 },
  { id: 'my', label: 'Malaysia', short: 'MY', x: 72, y: 52 },
  { id: 'sg', label: 'Singapore', short: 'SG', x: 74, y: 54 },
  { id: 'th', label: 'Thailand', short: 'TH', x: 70, y: 48 },
  { id: 'tr', label: 'Turkey', short: 'TR', x: 38, y: 32 },
  { id: 'uk', label: 'UK', short: 'UK', x: 28, y: 28 },
  { id: 'ca', label: 'Canada', short: 'CA', x: 18, y: 22 },
];

export const STATS = [
  { value: 15, suffix: '+', label: 'Countries we book to' },
  { value: 500, suffix: '+', label: 'Clients served each year' },
  { value: 24, suffix: '/7', label: 'WhatsApp enquiry line' },
  { value: 100, suffix: '%', label: 'Visa files document-checked' },
];

export const HERO_CREDIBILITY = [
  { value: '10+ yrs', label: 'Serving Sylhet travelers' },
  { value: '15+', label: 'International destinations' },
  { value: '1,000+', label: 'Tickets & packages booked' },
  { value: '2–4 hrs', label: 'Typical WhatsApp response' },
];

export const HERO_TRUST_POINTS = [
  'Physical travel desk at Gasbari Bazar, Kanaighat — not an anonymous website',
  'Flights to Gulf, Southeast Asia, UK & Canada · visa & Umrah under one roof',
  'Pay by bank transfer, bKash, Nagad, or cash at our Sylhet office',
];

export const TESTIMONIALS = [
  {
    id: 1,
    name: 'Rahim Uddin',
    role: 'Shop owner',
    location: 'Ambarkhana, Sylhet',
    trip: 'Dubai family tickets (4 pax)',
    rating: 5,
    text: 'I compared three agencies in Sylhet for Eid Dubai tickets. Show Terra Flight gave the clearest BDT breakdown on WhatsApp and issued all four PNRs the same afternoon. No surprise add-ons at payment.',
    avatar: '/images/home/person.svg',
  },
  {
    id: 2,
    name: 'Fatima Begum',
    role: 'Homemaker',
    location: 'Kanaighat, Sylhet',
    trip: 'Umrah package · Feb 2025',
    rating: 5,
    text: 'Our group of 22 left from Dhaka with everything arranged — flights, visa, Makkah hotel near Haram, and Madinah stay. Tanvir bhai was reachable on WhatsApp throughout the trip when we had a bus timing question.',
    avatar: '/images/home/person.svg',
  },
  {
    id: 3,
    name: 'Karim Ahmed',
    role: 'Import business',
    location: 'Gulshan, Dhaka',
    trip: 'Malaysia business visa',
    rating: 5,
    text: 'I travel to KL every quarter. Ayesha reviewed my invitation letter and bank statements twice before submission — visa approved in nine working days. They now handle our company\'s recurring ticket bookings too.',
    avatar: '/images/home/person.svg',
  },
  {
    id: 4,
    name: 'Nusrat Jahan',
    role: 'School teacher',
    location: 'Zindabazar, Sylhet',
    trip: 'Bangkok & Pattaya package',
    rating: 5,
    text: 'First international holiday for our family of five. The Pattaya hotel matched the photos they sent, pickup was waiting at BKK airport with our name board, and Sadia helped reschedule one flight when school dates shifted.',
    avatar: '/images/home/person.svg',
  },
];

export const GALLERY_ITEMS = [
  {
    id: 1,
    category: 'tours',
    title: 'Dubai Eid group · 18 travelers',
    subtitle: 'Departure lounge, HSIA · Apr 2025',
    image: '/images/home/gallery.svg',
  },
  {
    id: 2,
    category: 'visa',
    title: 'UAE visa stamped — client pickup',
    subtitle: 'Kanaighat office · visa desk',
    image: '/images/home/gallery.svg',
  },
  {
    id: 3,
    category: 'airport',
    title: 'Sylhet families seeing off to Jeddah',
    subtitle: 'Osmani International · Umrah season',
    image: '/images/home/gallery.svg',
  },
  {
    id: 4,
    category: 'group',
    title: 'Umrah group at Masjid an-Nabawi',
    subtitle: '22 pilgrims · guided ziyarat',
    image: '/images/home/gallery.svg',
  },
  {
    id: 5,
    category: 'tours',
    title: 'Bangkok temple & river tour',
    subtitle: 'Thailand package · family of 5',
    image: '/images/home/gallery.svg',
  },
  {
    id: 6,
    category: 'airport',
    title: 'Ticket handover before UK departure',
    subtitle: 'Show Terra Flight desk · Dhaka',
    image: '/images/home/gallery.svg',
  },
  {
    id: 7,
    category: 'group',
    title: 'Corporate retreat — Kuala Lumpur',
    subtitle: '12 staff · Genting extension',
    image: '/images/home/gallery.svg',
  },
  {
    id: 8,
    category: 'visa',
    title: 'Schengen file review session',
    subtitle: 'Document checklist · walk-in support',
    image: '/images/home/gallery.svg',
  },
];

export const GALLERY_FILTERS = [
  { id: 'all', label: 'All moments' },
  { id: 'tours', label: 'Holiday tours' },
  { id: 'visa', label: 'Visa success' },
  { id: 'airport', label: 'Airport send-offs' },
  { id: 'group', label: 'Group departures' },
];

export const TEAM = [
  {
    id: 1,
    name: 'Kamil Hussen',
    role: 'Managing Director',
    bio: 'Founded the Kanaighat desk in 2014. Negotiates airline allotments for Gulf and UK routes and oversees fare quotes for walk-in and WhatsApp clients.',
    image: '/images/home/person.svg',
  },
  {
    id: 2,
    name: 'Ayesha Rahman',
    role: 'Visa & Documentation Officer',
    bio: 'Prepares UAE, Malaysia, Thailand, and Schengen files — checks bank statements, NOC letters, and photos before embassy submission.',
    image: '/images/home/person.svg',
  },
  {
    id: 3,
    name: 'Tanvir Hasan',
    role: 'Umrah & Tour Coordinator',
    bio: 'Builds group Umrah and holiday itineraries with hotel partners in Makkah, Madinah, Dubai, and Bangkok. On-call during departures.',
    image: '/images/home/person.svg',
  },
  {
    id: 4,
    name: 'Sadia Akter',
    role: 'Customer Care · WhatsApp Desk',
    bio: 'First point of contact for quotes, PNR delivery, date changes, and refund follow-ups. Replies on WhatsApp from 8am until late evening.',
    image: '/images/home/person.svg',
  },
];

export const TRUST_ITEMS = [
  {
    title: 'Sylhet consultants you can meet',
    desc: 'Visit our Gasbari Bazar desk, call, or message WhatsApp — the same team handles your booking start to finish.',
  },
  {
    title: 'Clear BDT quotes upfront',
    desc: 'Total fare or package price confirmed before payment. No last-minute add-ons at the counter.',
  },
  {
    title: 'One desk for the full journey',
    desc: 'Air tickets, visa filing, Umrah groups, hotels, and corporate accounts — handled under one roof.',
  },
  {
    title: 'Bank, bKash, Nagad & cash',
    desc: 'Pay the way you already send money at home. Receipt issued for every transaction.',
  },
];

export const TRUST_ASSURANCES = [
  'GDS & airline-direct fares',
  'Document-checked visa files',
  'PNR delivery before payment',
];

export const SUPPORT_REASSURANCE = {
  response: 'WhatsApp replies typically within 2–4 hours on business days',
  hours: 'Office Sun–Thu 9:00am–8:00pm · Sat 10:00am–6:00pm',
  booking: 'We confirm seat availability and total BDT price before you pay',
};
