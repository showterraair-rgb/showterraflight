import { BRAND_NAME, DEFAULT_COMPANY, SUPPORT_REASSURANCE } from '../data/homeContent';

/** Merge API settings with static defaults — never returns undefined company */
export function normalizeCompanySettings(raw) {
  if (!raw || typeof raw !== 'object') {
    return { company: { ...DEFAULT_COMPANY }, logo: null, socialLinks: {}, paymentDetails: {} };
  }

  const companyRaw = raw.company && typeof raw.company === 'object' ? raw.company : {};
  const company = { ...DEFAULT_COMPANY };

  for (const [key, value] of Object.entries(companyRaw)) {
    if (value != null && String(value).trim() !== '') {
      company[key] = value;
    }
  }

  const logo =
    raw.logo && typeof raw.logo === 'object' && raw.logo.url ? raw.logo : null;

  const socialLinks =
    raw.socialLinks && typeof raw.socialLinks === 'object' ? raw.socialLinks : {};

  const paymentDetails =
    raw.paymentDetails && typeof raw.paymentDetails === 'object' ? raw.paymentDetails : {};

  return { company, logo, socialLinks, paymentDetails };
}

export function getWhatsAppDigits(company) {
  return String(company?.whatsapp ?? DEFAULT_COMPANY.whatsapp).replace(/\D/g, '');
}

export function getPhoneDigits(company) {
  return String(company?.directorPhone ?? DEFAULT_COMPANY.directorPhone).replace(/\D/g, '');
}

export function getDisplayName(company) {
  const name = company?.name ?? DEFAULT_COMPANY.name ?? BRAND_NAME;
  return String(name).includes('Flight') ? name : BRAND_NAME;
}

export function getSupportText(key, fallback) {
  const value = SUPPORT_REASSURANCE?.[key];
  return value != null && String(value).trim() !== '' ? value : fallback;
}

/** Normalize CMS page content objects */
export function normalizeCmsContent(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  return raw;
}
