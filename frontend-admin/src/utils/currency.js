const LOCALES = { BDT: 'en-BD', BRL: 'pt-BR', USD: 'en-US' };
const SYMBOLS = { BDT: '৳', BRL: 'R$' };

export function formatCurrency(amount, currency = 'BDT') {
  const value = Number(amount) || 0;
  if (currency === 'BRL') {
    return `${SYMBOLS.BRL} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (currency === 'BDT') {
    return `${SYMBOLS.BDT} ${value.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return new Intl.NumberFormat(LOCALES[currency] || 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default formatCurrency;
