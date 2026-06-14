/**
 * Deep-merge CMS home page content with structured defaults (public API).
 */
import { buildFullHomeSeedContent } from '../config/fullHomeSeedContent.js';

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
  if (defaults.filters && cmsSection.filters?.length) merged.filters = cmsSection.filters;
  if (defaults.destinations && cmsSection.destinations?.length) merged.destinations = cmsSection.destinations;
  if (defaults.stats && cmsSection.stats?.length) merged.stats = cmsSection.stats;
  if (defaults.credibility && cmsSection.credibility?.length) merged.credibility = cmsSection.credibility;
  if (defaults.assurances && cmsSection.assurances?.length) merged.assurances = cmsSection.assurances;
  if (defaults.payments && cmsSection.payments?.length) merged.payments = cmsSection.payments;
  return merged;
}

export function mergeHomeCmsContent(cmsRaw = {}) {
  const defaults = buildFullHomeSeedContent();
  const cmsSections = cmsRaw.sections && typeof cmsRaw.sections === 'object' ? cmsRaw.sections : {};
  const mergedSections = {};

  for (const [key, sectionDefaults] of Object.entries(defaults.sections)) {
    mergedSections[key] = mergeSection(sectionDefaults, cmsSections[key]);
    if (cmsSections[key]?.visible === false) {
      mergedSections[key] = { ...mergedSections[key], visible: false };
    }
  }

  const merged = {
    ...defaults,
    ...cmsRaw,
    sections: mergedSections,
    supportReassurance: {
      ...defaults.supportReassurance,
      ...(cmsRaw.supportReassurance || {}),
    },
  };

  if (cmsRaw.heroTitle || cmsRaw.heroSubtitle || cmsRaw.heroImage) {
    const slides = [...(mergedSections.hero?.slides || defaults.sections.hero.slides)];
    if (slides[0]) {
      slides[0] = {
        ...slides[0],
        ...(cmsRaw.heroTitle ? { title: cmsRaw.heroTitle } : {}),
        ...(cmsRaw.heroSubtitle ? { subtitle: cmsRaw.heroSubtitle } : {}),
        ...(cmsRaw.heroImage ? { image: cmsRaw.heroImage } : {}),
      };
    }
    mergedSections.hero = { ...mergedSections.hero, slides };
    merged.sections = mergedSections;
  }

  return merged;
}

export default mergeHomeCmsContent;
