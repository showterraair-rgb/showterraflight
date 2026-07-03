/** Bangladesh phone helpers for admin forms (mirrors backend phoneUtils). */

export const BD_PHONE_PLACEHOLDER = '+8801712345678';
export const BD_PHONE_HELP = '+880 Bangladesh — enter +88017… or 017…; SMS API sends as 88017…';
export const BD_SENDER_PLACEHOLDER = '+8809648909214';
export const BD_SENDER_HELP = 'Copy senderid from BulkSMSBD Developers page (e.g. +8809648909214)';

function digitsOnly(raw) {
  return String(raw || '').replace(/\D/g, '');
}

export function isValidBdMobile(raw) {
  const digits = digitsOnly(raw);
  if (!digits) return false;
  if (/^01[3-9]\d{8}$/.test(digits)) return true;
  if (/^8801[3-9]\d{8}$/.test(digits)) return true;
  if (/^1[3-9]\d{8}$/.test(digits)) return true;
  return false;
}

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

export function internationalBdNumber(raw) {
  const local = localBdNumber(raw);
  if (local && /^0\d{10}$/.test(local)) {
    return `+880${local.slice(1)}`;
  }
  const digits = digitsOnly(raw);
  if (digits.startsWith('880') && digits.length >= 12) {
    return `+${digits.slice(0, 13)}`;
  }
  return '';
}

/** @deprecated Use localBdNumber */
export function localBdPhone(raw) {
  const local = localBdNumber(raw);
  return isValidBdMobile(local || raw) ? local : localBdNumber(raw);
}

export function formatPhoneOnBlur(value) {
  if (!value?.trim()) return '';
  const intl = internationalBdNumber(value);
  if (intl && isValidBdMobile(value)) return intl;
  return value.trim();
}

export function formatSenderIdOnBlur(value, isMasking = false) {
  if (!value?.trim()) return '';
  if (isMasking || /[A-Za-z]/.test(value)) {
    return value.trim().slice(0, 11);
  }
  const digits = digitsOnly(value);
  if (digits.startsWith('880') && digits.length >= 12) {
    return `+${digits.slice(0, 13)}`;
  }
  if (digits.startsWith('0') && digits.length >= 10) {
    return `+880${digits.slice(1, 11)}`;
  }
  return value.trim();
}

