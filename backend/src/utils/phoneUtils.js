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

export default { normalizeBdPhone };
