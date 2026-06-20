/**
 * Normalize Bangladesh mobile numbers to BulkSMSBD format: 88017XXXXXXXX
 */
export function normalizeBdPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('880') && digits.length >= 12) {
    return digits.slice(0, 13);
  }

  if (digits.startsWith('0') && digits.length === 11) {
    return `88${digits}`;
  }

  if (digits.startsWith('1') && digits.length === 10) {
    return `880${digits}`;
  }

  return digits;
}

/**
 * Normalize phone for WhatsApp Cloud API (digits only, country code, no +).
 * Default country code: 880 (Bangladesh).
 */
export function normalizeWaPhone(raw, defaultCountryCode = '880') {
  const cc = String(defaultCountryCode || '880').replace(/\D/g, '') || '880';
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith(cc) && digits.length >= cc.length + 8) {
    return digits.slice(0, 15);
  }

  if (digits.startsWith('0') && digits.length === 11) {
    return `${cc}${digits.slice(1)}`;
  }

  if (digits.startsWith('1') && digits.length === 10 && cc === '880') {
    return `${cc}${digits}`;
  }

  if (digits.length >= 8 && digits.length <= 12 && !digits.startsWith(cc)) {
    return `${cc}${digits}`;
  }

  return digits;
}

export default { normalizeBdPhone, normalizeWaPhone };
