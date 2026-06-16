export default function DualCurrencyAmount({
  amountBDT,
  originalAmount,
  originalCurrency = 'BDT',
  exchangeRate,
  showIn = 'BDT',
  rates = { BDT: 1, BRL: 22.5 },
  className = '',
  primaryClassName = 'font-semibold',
  secondaryClassName = 'text-xs text-slate-500',
}) {
  const bdt = Number(amountBDT ?? 0);
  const rate = exchangeRate ?? rates.BRL ?? 22.5;
  const original = originalAmount != null ? Number(originalAmount) : (originalCurrency === 'BDT' ? bdt : bdt / rate);

  const primaryCurrency = showIn;
  const secondaryCurrency = showIn === 'BDT' ? 'BRL' : 'BDT';

  const primaryAmount = primaryCurrency === 'BDT'
    ? bdt
    : (originalCurrency === 'BRL' ? original : bdt / rate);

  const secondaryAmount = secondaryCurrency === 'BDT'
    ? bdt
    : (originalCurrency === 'BRL' ? original : bdt / rate);

  const symbols = { BDT: '৳', BRL: 'R$' };
  const fmt = (n, cur) => `${symbols[cur] || cur} ${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className={className}>
      <p className={primaryClassName}>{fmt(primaryAmount, primaryCurrency)}</p>
      <p className={secondaryClassName}>{fmt(secondaryAmount, secondaryCurrency)}</p>
    </div>
  );
}
