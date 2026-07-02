export const BD_PHONE_PLACEHOLDER = '01712345678 or +8801712345678';
export const BD_PHONE_HELP = '017 / 018 / 019 or +880 — saved as 01XXXXXXXXX, SMS sent as 8801XXXXXXXXX';

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

export function localBdPhone(raw) {
  const digits = digitsOnly(raw);
  if (!digits) return '';
  if (digits.startsWith('880') && digits.length >= 13) {
    return `0${digits.slice(3, 13)}`;
  }
  if (digits.startsWith('0') && digits.length === 11) return digits;
  if (digits.length === 10 && digits.startsWith('1')) return `0${digits}`;
  return String(raw || '').trim();
}

export function formatPhoneOnBlur(value) {
  if (!value?.trim()) return '';
  const local = localBdPhone(value);
  return isValidBdMobile(local || value) ? local : value.trim();
}
