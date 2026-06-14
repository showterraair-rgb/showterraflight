import { useCompany } from '../../context/CompanyContext';
import { useHomeContent } from '../../context/HomeContentContext';
import { getSupportText } from '../../utils/companyHelpers';

export default function PaymentStrip({ variant = 'light', className = '' }) {
  const { paymentDetails = {} } = useCompany();
  const strip = useHomeContent('paymentStrip');
  const isDark = variant === 'dark';

  if (strip?.visible === false) return null;

  const methods = (strip?.methods || []).filter((m) => m.visible !== false);
  const label = strip?.label || 'Pay via';
  const supportLine = getSupportText('response', 'WhatsApp replies typically within 2–4 hours on business days');
  const supportSubline = strip?.supportSubline || 'Booking help 7 days a week';

  return (
    <div className={`flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6 ${className}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`shrink-0 text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {label}
          </span>
          {methods.map((m) => (
            <span
              key={m.id}
              className={`payment-chip-interactive inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                isDark ? 'border-white/15 bg-white/5 text-white' : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <span className={m.accent || (isDark ? 'text-sky-300' : 'text-brand-600')}>{m.abbr}</span>
              <span className="whitespace-nowrap">{m.label}</span>
            </span>
          ))}
        </div>
        {(paymentDetails.bankName || paymentDetails.bkashNumber) && (
          <p className={`mt-2 text-[11px] leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {paymentDetails.bankName && <>Bank: {paymentDetails.bankName}</>}
            {paymentDetails.bkashNumber && <> · bKash: {paymentDetails.bkashNumber}</>}
            {paymentDetails.nagadNumber && <> · Nagad: {paymentDetails.nagadNumber}</>}
          </p>
        )}
      </div>
      <p
        className={`max-w-none text-xs leading-relaxed md:max-w-[15rem] md:text-right ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}
      >
        {supportLine}
        <span className="mt-0.5 block text-[11px] opacity-90">{supportSubline}</span>
      </p>
    </div>
  );
}
