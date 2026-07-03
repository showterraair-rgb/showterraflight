/**
 * Bangladesh mobile normalization.
 * Operators: 013 Teletalk, 014, 015, 016 Airtel, 017 GP, 018 Robi, 019 Banglalink.
 *
 * Accepted input examples:
 *   01712345678, 01812345678, 01912345678
 *   8801712345678, +8801712345678
 *   1712345678 (10 digits)
 *
 * Storage: 01XXXXXXXXX (11 digits)
 * SMS API:  8801XXXXXXXXX (13 digits, no +)
 * Display:  +8801XXXXXXXXX
 */

/** 01 + operator digit 3–9 + 8 subscriber digits */
const BD_MOBILE_LOCAL = /^01[3-9]\d{8}$/;
const BD_MOBILE_CANONICAL = /^8801[3-9]\d{8}$/;

export const BD_PHONE_HELP =
  '+880 Bangladesh — enter +88017XXXXXXXX or 017XXXXXXXX; SMS sent as 88017XXXXXXXX';

export const BD_PHONE_PLACEHOLDER = '+8801712345678';

function digitsOnly(raw) {
  return String(raw || '').replace(/\D/g, '');
}

/** International format for BulkSMSBD: 8801XXXXXXXXX (no +) */
export function canonicalBdPhone(raw) {
  const digits = digitsOnly(raw);
  if (!digits) return '';

  if (digits.startsWith('880') && digits.length >= 13) {
    return digits.slice(0, 13);
  }

  if (digits.startsWith('880') && digits.length === 12) {
    return digits;
  }

  if (digits.startsWith('0') && digits.length === 11) {
    return `880${digits.slice(1)}`;
  }

  if (digits.startsWith('1') && digits.length === 10) {
    return `880${digits}`;
  }

  if (digits.length === 11 && digits.startsWith('01')) {
    return `880${digits.slice(1)}`;
  }

  return digits;
}

/** E.164 with plus: +8801XXXXXXXXX (mobile) */
export function internationalBdPhone(raw) {
  const canonical = canonicalBdPhone(raw);
  if (!canonical || !BD_MOBILE_CANONICAL.test(canonical)) return '';
  return `+${canonical}`;
}

/** Local 0XXXXXXXXXX for any BD number (mobile 017… or dedicated 096…). */
export function localBdNumber(raw) {
  const digits = digitsOnly(raw);
  if (!digits) return '';

  if (digits.startsWith('880') && digits.length >= 12) {
    return `0${digits.slice(3, 13)}`;
  }
  if (digits.startsWith('0') && digits.length >= 10) {
    return digits.slice(0, 11);
  }
  if (digits.length === 10) {
    return `0${digits}`;
  }
  return String(raw || '').trim();
}

/** E.164 +880 for any BD number (mobile or dedicated sender line). */
export function internationalBdNumber(raw) {
  const local = localBdNumber(raw);
  if (local && /^0\d{10}$/.test(local)) {
    return `+880${local.slice(1)}`;
  }
  const digits = digitsOnly(raw);
  if (digits.startsWith('880') && digits.length >= 12) {
    return `+${digits.slice(0, 13)}`;
  }
  return internationalBdPhone(raw);
}

/** Local display/storage format: 01XXXXXXXXX */
export function localBdPhone(raw) {
  const canonical = canonicalBdPhone(raw);
  if (!canonical || !canonical.startsWith('880') || canonical.length < 12) {
    return String(raw || '').trim();
  }
  const local = `0${canonical.slice(3, 13)}`;
  return BD_MOBILE_LOCAL.test(local) ? local : '';
}

/** @deprecated Use canonicalBdPhone */
export function normalizeBdPhone(raw) {
  return canonicalBdPhone(raw);
}

export function normalizeWaPhone(raw, defaultCountryCode = '880') {
  return canonicalBdPhone(raw) || canonicalBdPhone(`+${defaultCountryCode}${digitsOnly(raw)}`);
}

export function isValidBdMobile(raw) {
  const local = localBdPhone(raw);
  const canonical = canonicalBdPhone(raw);
  return BD_MOBILE_LOCAL.test(local) || BD_MOBILE_CANONICAL.test(canonical);
}

/** Normalize CRM party phone fields for persistence. */
export function normalizePartyPhoneFields({ phone, whatsapp } = {}) {
  const localPhone = localBdPhone(phone);
  if (!localPhone || !isValidBdMobile(localPhone)) {
    return { phone: '', whatsapp: '', valid: false };
  }

  const localWa = whatsapp ? localBdPhone(whatsapp) : '';
  const wa = localWa && isValidBdMobile(localWa) ? localWa : '';

  return {
    phone: localPhone,
    whatsapp: wa,
    valid: true,
  };
}

/** SMS + WhatsApp numbers for notification dispatch. */
export function resolveContactChannels({ phone, whatsapp } = {}) {
  const smsPhone = canonicalBdPhone(phone);
  const waPhone = canonicalBdPhone(whatsapp || phone);
  return {
    smsPhone,
    waPhone: waPhone || smsPhone,
    smsInternational: internationalBdPhone(phone),
    waInternational: internationalBdPhone(whatsapp || phone),
  };
}

/** MongoDB $in variants for duplicate phone lookup. */
export function phoneMatchValues(raw) {
  const local = localBdPhone(raw);
  const canonical = canonicalBdPhone(raw);
  const intl = internationalBdPhone(raw);
  const digits = digitsOnly(raw);
  return [...new Set([String(raw || '').trim(), local, canonical, intl, digits].filter(Boolean))];
}

export function phoneMatchQuery(field, raw) {
  return { [field]: { $in: phoneMatchValues(raw) } };
}

export default {
  BD_PHONE_HELP,
  BD_PHONE_PLACEHOLDER,
  canonicalBdPhone,
  internationalBdPhone,
  internationalBdNumber,
  localBdNumber,
  localBdPhone,
  normalizeBdPhone,
  normalizeWaPhone,
  isValidBdMobile,
  normalizePartyPhoneFields,
  resolveContactChannels,
  phoneMatchValues,
  phoneMatchQuery,
};
