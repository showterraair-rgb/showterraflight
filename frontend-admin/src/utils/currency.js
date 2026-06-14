export function formatCurrency(amount, currency = 'BDT') {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default formatCurrency;
