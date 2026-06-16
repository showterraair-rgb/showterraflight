const SIZE_CLASSES = {
  sm: { primary: 'text-sm font-semibold', secondary: 'text-[0.70rem] font-normal text-slate-500' },
  md: { primary: 'text-base font-semibold', secondary: 'text-xs font-normal text-slate-500' },
  lg: { primary: 'text-xl font-bold', secondary: 'text-sm font-normal text-slate-500' },
};

function fmt(n) {
  return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function DualCurrencyAmount({ totalBRL, totalBDT, size = 'md', className = '' }) {
  const sizes = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  return (
    <div className={`dual-currency flex flex-col gap-0.5 ${className}`}>
      <span className={`amount-primary ${sizes.primary} text-slate-900`}>R$ {fmt(totalBRL)}</span>
      <span className={`amount-secondary ${sizes.secondary}`}>৳ {fmt(totalBDT)}</span>
    </div>
  );
}

/** Extract BRL/BDT totals from API booking or pricing object */
export function getBookingAmounts(booking) {
  const p = booking?.pricing || booking;
  const bdtRate = p.bdtRateAtBooking ?? p.exchangeRateAtBooking ?? 22.5;
  const totalBRL = p.totalFareBRL ?? p.originalTotalFare ?? p.totalFare ?? 0;
  const totalBDT = p.totalFareBDT ?? totalBRL * bdtRate;
  return {
    totalBRL,
    totalBDT,
    bdtRate,
    baseFareBRL: p.baseFareBRL ?? p.originalBaseFare ?? p.baseFare ?? 0,
    taxBRL: p.taxBRL ?? p.originalTax ?? p.tax ?? 0,
    markupBRL: p.markupBRL ?? p.originalMarkup ?? p.agentMarkup ?? 0,
    baseFareBDT: p.baseFareBDT ?? 0,
    taxBDT: p.taxBDT ?? 0,
    markupBDT: p.markupBDT ?? 0,
  };
}
