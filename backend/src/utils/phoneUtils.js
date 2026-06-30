/**
 * Bangladesh mobile normalization.
 * - Store locally as 01XXXXXXXXX (11 digits) in CRM records.
 * - Send to SMS/WhatsApp gateways as 8801XXXXXXXXX (13 digits).
 */

const BD_MOBILE_LOCAL = /^01[3-9]\d{8}$/;
const BD_MOBILE_CANONICAL = /^8801[3-9]\d{8}$/;

function digitsOnly(raw) {
  return String(raw || '').replace(/\D/g, '');
}

/** International format for BulkSMSBD / WhatsApp APIs: 8801XXXXXXXXX */
export function canonicalBdPhone(raw) {
  const digits = digitsOnly(raw);
  if (!digits) return '';

  if (digits.startsWith('880') && digits.length >= 12) {
    return digits.slice(0, 13);
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

/** Local display/storage format: 01XXXXXXXXX */
export function localBdPhone(raw) {
  const canonical = canonicalBdPhone(raw);
  if (!canonical || !canonical.startsWith('880') || canonical.length < 13) {
    return String(raw || '').trim();
  }
  return `0${canonical.slice(3, 13)}`;
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
  };
}

/** MongoDB $in variants for duplicate phone lookup. */
export function phoneMatchValues(raw) {
  const local = localBdPhone(raw);
  const canonical = canonicalBdPhone(raw);
  const digits = digitsOnly(raw);
  return [...new Set([String(raw || '').trim(), local, canonical, digits].filter(Boolean))];
}

export function phoneMatchQuery(field, raw) {
  return { [field]: { $in: phoneMatchValues(raw) } };
}

export default {
  canonicalBdPhone,
  localBdPhone,
  normalizeBdPhone,
  normalizeWaPhone,
  isValidBdMobile,
  normalizePartyPhoneFields,
  resolveContactChannels,
  phoneMatchValues,
  phoneMatchQuery,
};
