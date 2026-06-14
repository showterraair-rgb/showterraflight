import { TRUST_ASSURANCES, TRUST_ITEMS } from '../../data/homeContent';
import { useHomeContent } from '../../context/HomeContentContext';
import { SectionReveal } from './motion';
import { getSupportText } from '../../utils/companyHelpers';

const PAYMENTS = [
  { id: 'bank', label: 'Bank Transfer', sub: 'Any Bangladeshi bank · office receipt issued', color: 'bg-blue-700' },
  { id: 'bkash', label: 'bKash', sub: 'Personal & merchant payment', color: 'bg-[#e2136e]' },
  { id: 'nagad', label: 'Nagad', sub: 'Personal & merchant payment', color: 'bg-[#f69220]' },
];

export default function TrustStatsSection() {
  const section = useHomeContent('trust');
  const trustItems = section?.items || TRUST_ITEMS;
  const assurances = section?.assurances || TRUST_ASSURANCES;
  const payments = section?.payments?.length ? section.payments : PAYMENTS;
  const stats = section?.stats || [];

  if (section?.visible === false) return null;

  return (
    <section className="border-y border-slate-200 bg-white py-16 md:py-20">
      <div className="container-page">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <SectionReveal>
            <p className="section-eyebrow">{section?.eyebrow || 'Why book with us'}</p>
            <h2 className="section-title mt-2">{section?.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {getSupportText('booking', 'We confirm seat availability and total BDT price before you pay')}
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {trustItems.map((item) => (
                <div key={item.title} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50/60 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Support availability</p>
              <p className="mt-2 text-sm text-slate-700">
                {getSupportText('response', 'WhatsApp replies typically within 2–4 hours on business days')}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {getSupportText('hours', 'Office Sun–Thu 9:00am–8:00pm · Sat 10:00am–6:00pm')}
              </p>
            </div>
          </SectionReveal>

          <SectionReveal delay={0.08}>
            <div className="rounded-2xl bg-brand-950 p-6 text-white md:p-8">
              <p className="text-xs font-bold uppercase tracking-wider text-sky-400">Secure payments</p>
              <h3 className="mt-2 text-xl font-bold md:text-2xl">Pay the way Bangladesh travels</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Settle at our Gasbari Bazar office or pay remotely — we share account details only after confirming
                your quote and seat availability.
              </p>

              <div className="mt-6 space-y-3">
                {payments.map((p) => (
                  <div key={p.id} className={`payment-chip w-full ${p.color}`}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-xs font-bold">
                      {p.label.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <p className="font-bold leading-none">{p.label}</p>
                      <p className="mt-0.5 text-xs text-white/80">{p.sub}</p>
                    </div>
                  </div>
                ))}
                <div className="payment-chip w-full border border-white/20 bg-white/5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs font-bold">
                    TK
                  </span>
                  <div>
                    <p className="font-bold leading-none">Cash at office</p>
                    <p className="mt-0.5 text-xs text-white/70">Gasbari Bazar, Kanaighat, Sylhet</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-6">
                {assurances.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-6 text-center">
                {(stats.length ? stats : [
                  { value: '10+', label: 'Years in Sylhet' },
                  { value: '1,000+', label: 'Bookings handled' },
                  { value: '4.9★', label: 'Client rating' },
                ]).map((s) => (
                  <div key={s.label}>
                    <p className="text-xl font-bold text-accent-400 md:text-2xl">{s.value}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400 md:text-xs">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
