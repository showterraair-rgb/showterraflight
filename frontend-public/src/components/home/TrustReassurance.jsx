import { getSupportText } from '../../utils/companyHelpers';

/** One-line booking reassurance for sections with CTAs */
export default function TrustReassurance({ className = '', variant = 'light' }) {
  const isDark = variant === 'dark';
  const isMuted = variant === 'muted';

  const booking = getSupportText('booking', 'We confirm seat availability and total BDT price before you pay');
  const response = getSupportText('response', 'WhatsApp replies typically within 2–4 hours on business days');

  return (
    <p
      className={`text-xs leading-relaxed ${
        isDark ? 'text-slate-400' : isMuted ? 'text-slate-500' : 'text-slate-600'
      } ${className}`}
    >
      {booking}. {response}.
    </p>
  );
}
