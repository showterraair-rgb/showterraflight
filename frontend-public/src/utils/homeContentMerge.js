import {
  SERVICES,
  PROMO_SLIDES,
  PACKAGES,
  WORLD_DESTINATIONS,
  STATS,
  HERO_CREDIBILITY,
  TESTIMONIALS,
  GALLERY_ITEMS,
  GALLERY_FILTERS,
  TEAM,
  TRUST_ITEMS,
  TRUST_ASSURANCES,
  SUPPORT_REASSURANCE,
} from '../data/homeContent';
import {
  DEFAULT_HERO_SLIDES,
  DEFAULT_FOOTER,
  DEFAULT_PAYMENT_STRIP,
} from '../data/cmsDefaults';
import { HOME_IMAGE_FALLBACKS } from './imageUtils';

const withLocalImages = {
  hero: {
    visible: true,
    autoplayMs: 6000,
    credibility: HERO_CREDIBILITY,
    slides: DEFAULT_HERO_SLIDES,
  },
  promo: {
    visible: true,
    eyebrow: 'Current offers',
    title: 'Seasonal deals for Bangladesh travelers',
    slides: PROMO_SLIDES.map((s) => ({
      ...s,
      image: s.image?.includes('unsplash') ? HOME_IMAGE_FALLBACKS.promo : s.image,
    })),
  },
  services: {
    visible: true,
    eyebrow: 'What we do',
    title: 'Full travel services from one Sylhet desk',
    subtitle: 'Air tickets, visas, Umrah, hotels, and tour packages — quoted in BDT with personal follow-up.',
    items: SERVICES,
  },
  packages: {
    visible: true,
    eyebrow: 'Tour packages',
    title: 'Real offers departing from Bangladesh',
    subtitle:
      'Indicative BDT pricing for flights, hotels, and ground support — final quote depends on travel dates, airline, and room type.',
    items: PACKAGES.map((p) => ({
      ...p,
      image: p.image?.includes('unsplash') ? HOME_IMAGE_FALLBACKS.destination : p.image,
    })),
  },
  worldMap: {
    visible: true,
    eyebrow: 'Bangladesh to the world',
    title: 'Routes we book every week',
    subtitle: 'From Sylhet and Dhaka to the Gulf, Southeast Asia, Europe, and North America.',
    destinations: WORLD_DESTINATIONS,
    stats: STATS,
  },
  about: {
    visible: true,
    eyebrow: 'About us',
    title: 'A Sylhet travel agency with nationwide reach',
    lead: 'Full-service travel desk at Gasbari Bazar, Kanaighat — transparent BDT pricing and consultants you can speak to directly.',
    body: 'From a last-minute Jeddah ticket to a Malaysia family package or corporate travel for your business, we stay with you from the first quote to boarding pass delivery.',
    image: HOME_IMAGE_FALLBACKS.office,
    imageCaption: 'Your local international travel desk',
    imageLocation: 'Kanaighat, Sylhet',
  },
  testimonials: {
    visible: true,
    eyebrow: 'Client stories',
    title: 'Trusted by travelers across Sylhet & Dhaka',
    subtitle: 'Real feedback from families, business travelers, and Umrah groups we have served.',
    items: TESTIMONIALS.map((t) => ({
      ...t,
      avatar: t.avatar?.includes('unsplash') ? HOME_IMAGE_FALLBACKS.person : t.avatar,
    })),
  },
  gallery: {
    visible: true,
    eyebrow: 'Our work',
    title: 'Moments from departures & visa wins',
    subtitle: 'Airport send-offs, Umrah groups, and visa pickups at our Kanaighat office.',
    filters: GALLERY_FILTERS,
    items: GALLERY_ITEMS.map((g) => ({
      ...g,
      image: g.image?.includes('unsplash') ? HOME_IMAGE_FALLBACKS.gallery : g.image,
    })),
  },
  team: {
    visible: true,
    eyebrow: 'Meet the team',
    title: 'Consultants you can call or visit',
    subtitle: 'Walk in at Gasbari Bazar or message us on WhatsApp — the same team handles your booking.',
    items: TEAM.map((m) => ({
      ...m,
      image: m.image?.includes('unsplash') ? HOME_IMAGE_FALLBACKS.person : m.image,
    })),
  },
  trust: {
    visible: true,
    eyebrow: 'Why book with us',
    title: 'A Sylhet travel desk you can visit in person',
    items: TRUST_ITEMS,
    assurances: TRUST_ASSURANCES,
    payments: [
      { id: 'bank', label: 'Bank Transfer', sub: 'Any Bangladeshi bank · office receipt issued', color: 'bg-blue-700' },
      { id: 'bkash', label: 'bKash', sub: 'Personal & merchant payment', color: 'bg-[#e2136e]' },
      { id: 'nagad', label: 'Nagad', sub: 'Personal & merchant payment', color: 'bg-[#f69220]' },
    ],
    stats: [
      { value: '10+', label: 'Years in Sylhet' },
      { value: '1,000+', label: 'Bookings handled' },
      { value: '4.9★', label: 'Client rating' },
    ],
  },
  paymentStrip: DEFAULT_PAYMENT_STRIP,
  cta: {
    visible: true,
    eyebrow: 'Start your booking',
    title: 'Ready to book your next trip from Bangladesh?',
    subtitle: 'Get a fare quote, visa guidance, or package price — our Kanaighat team responds quickly on WhatsApp and phone.',
    primaryCtaText: 'Talk on WhatsApp',
    primaryCtaLink: 'whatsapp',
    secondaryCtaText: 'Call Now',
    secondaryCtaLink: 'tel',
    tertiaryCtaText: 'Plan Your Trip',
    tertiaryCtaLink: '/booking',
    image: HOME_IMAGE_FALLBACKS.sky,
  },
  contact: {
    visible: true,
    eyebrow: 'Contact',
    title: 'Visit us or message on WhatsApp',
    subtitle: 'Gasbari Bazar, Ground Floor of BRAC Bank, Kanaighat, Sylhet-3183',
    officeTitle: 'Office',
    officeHeading: 'Kanaighat, Sylhet',
    directLineTitle: 'Direct line',
    directLineHeading: 'Phone & email',
    nextStepTitle: 'Next step',
    nextStepHeading: 'Start your booking',
    nextStepBody: 'Tell us your route and dates — we reply with fare options and package pricing in BDT.',
    whatsappButtonText: 'Message on WhatsApp',
  },
  footer: DEFAULT_FOOTER,
};

function mergeList(defaultItems = [], cmsItems = [], idKey = 'id') {
  if (!Array.isArray(cmsItems) || cmsItems.length === 0) return defaultItems;
  const map = new Map(defaultItems.map((item) => [String(item[idKey]), item]));
  return cmsItems
    .filter((item) => item && item.visible !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((item) => {
      const base = map.get(String(item[idKey])) || {};
      return { ...base, ...item };
    });
}

function mergeSection(defaults, cmsSection) {
  if (!cmsSection || typeof cmsSection !== 'object') return defaults;
  const merged = { ...defaults, ...cmsSection };
  if (defaults.slides) merged.slides = mergeList(defaults.slides, cmsSection.slides);
  if (defaults.items) merged.items = mergeList(defaults.items, cmsSection.items);
  if (defaults.methods) merged.methods = mergeList(defaults.methods, cmsSection.methods);
  if (defaults.exploreLinks) merged.exploreLinks = mergeList(defaults.exploreLinks, cmsSection.exploreLinks);
  if (defaults.paymentMethods) merged.paymentMethods = mergeList(defaults.paymentMethods, cmsSection.paymentMethods);
  if (defaults.filters) merged.filters = cmsSection.filters?.length ? cmsSection.filters : defaults.filters;
  if (defaults.destinations) merged.destinations = cmsSection.destinations?.length ? cmsSection.destinations : defaults.destinations;
  if (defaults.stats && cmsSection.stats) merged.stats = cmsSection.stats?.length ? cmsSection.stats : defaults.stats;
  if (defaults.credibility) merged.credibility = cmsSection.credibility?.length ? cmsSection.credibility : defaults.credibility;
  if (defaults.assurances) merged.assurances = cmsSection.assurances?.length ? cmsSection.assurances : defaults.assurances;
  if (defaults.payments) merged.payments = cmsSection.payments?.length ? cmsSection.payments : defaults.payments;
  return merged;
}

/** Merge CMS home content with static defaults */
export function mergeHomeContent(cmsRaw = {}) {
  const sections = cmsRaw.sections && typeof cmsRaw.sections === 'object' ? cmsRaw.sections : {};
  const merged = {};

  for (const [key, defaults] of Object.entries(withLocalImages)) {
    merged[key] = mergeSection(defaults, sections[key]);
    if (sections[key]?.visible === false) {
      merged[key] = { ...merged[key], visible: false };
    }
  }

  // Legacy flat hero fields → first slide fallback
  if (cmsRaw.heroTitle || cmsRaw.heroSubtitle || cmsRaw.heroImage) {
    const slides = [...(merged.hero.slides || DEFAULT_HERO_SLIDES)];
    if (slides[0]) {
      slides[0] = {
        ...slides[0],
        ...(cmsRaw.heroTitle ? { title: cmsRaw.heroTitle } : {}),
        ...(cmsRaw.heroSubtitle ? { subtitle: cmsRaw.heroSubtitle } : {}),
        ...(cmsRaw.heroImage ? { image: cmsRaw.heroImage } : {}),
      };
    }
    merged.hero = { ...merged.hero, slides };
  }

  if (cmsRaw.supportReassurance && typeof cmsRaw.supportReassurance === 'object') {
    merged.supportReassurance = { ...SUPPORT_REASSURANCE, ...cmsRaw.supportReassurance };
  } else {
    merged.supportReassurance = SUPPORT_REASSURANCE;
  }

  return merged;
}

export { withLocalImages as DEFAULT_HOME_SECTIONS };

export default mergeHomeContent;
