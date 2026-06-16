export const BOOKING_STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  reissued: 'Reissued',
  refunded: 'Refunded',
};

export const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-800',
  processing: 'bg-sky-100 text-sky-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
  reissued: 'bg-purple-100 text-purple-800',
  refunded: 'bg-slate-200 text-slate-700',
};

export const AIRLINES = [
  'Biman Bangladesh Airlines',
  'US-Bangla Airlines',
  'Novoair',
  'Emirates',
  'Qatar Airways',
  'Saudia',
  'Etihad Airways',
  'Turkish Airlines',
  'Singapore Airlines',
  'Other',
];

export const PASSENGER_TITLES = ['Mr', 'Mrs', 'Ms', 'Child', 'Infant'];

export function formatCurrency(n, currency = 'BDT') {
  const symbols = { BDT: '৳', BRL: 'R$' };
  const symbol = symbols[currency] || currency;
  return `${symbol} ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(v) {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
