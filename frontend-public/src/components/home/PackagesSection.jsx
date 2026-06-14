import { Link } from 'react-router-dom';
import { useHomeContent } from '../../context/HomeContentContext';
import SafeImage from '../common/SafeImage';
import { SectionReveal } from './motion';
import PaymentStrip from './PaymentStrip';
import TrustReassurance from './TrustReassurance';

export default function PackagesSection() {
  const section = useHomeContent('packages');
  const packages = section?.items || [];

  if (section?.visible === false) return null;

  return (
    <section id="packages" className="bg-slate-50 section-spacing">
      <div className="container-page">
        <SectionReveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="section-eyebrow">{section?.eyebrow || 'Tour packages'}</p>
            <h2 className="section-title mt-2">{section?.title || 'Real offers departing from Bangladesh'}</h2>
            <p className="section-lead max-w-xl">{section?.subtitle}</p>
          </div>
          <Link to="/booking" className="btn-outline w-full shrink-0 self-start sm:w-auto sm:self-auto">
            Plan Your Trip
          </Link>
        </SectionReveal>

        <TrustReassurance className="mt-4 max-w-2xl" variant="muted" />

        <div className="mt-10 grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
          {packages.map((pkg, i) => (
            <SectionReveal key={pkg.id} delay={i < 3 ? i * 0.06 : 0}>
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-md card-hover-lift">
                <div className="relative aspect-[5/4] overflow-hidden sm:aspect-[4/3]">
                  <SafeImage
                    src={pkg.image}
                    fallbackKey="destination"
                    alt={pkg.destination}
                    width={800}
                    height={640}
                    className="transition-transform duration-500 group-hover:scale-[1.04]"
                    containerClassName="h-full w-full"
                    aspectClass="h-full w-full"
                    showLabelOnFallback
                    label={pkg.destination}
                    loading="lazy"
                    decoding="async"
                  />
                  {pkg.badge && (
                    <span className="absolute left-3 top-3 rounded-full bg-accent-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-950 shadow-sm">
                      {pkg.badge}
                    </span>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-brand-950/90 to-transparent px-3 pb-3 pt-8">
                    <p className="text-xs font-medium text-slate-300">{pkg.departFrom}</p>
                    <p className="text-sm font-bold text-white">{pkg.duration}</p>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5 md:p-6">
                  <h3 className="text-xl font-bold text-slate-900">{pkg.destination}</h3>
                  {pkg.seasonNote && <p className="mt-1.5 text-xs leading-snug text-slate-500">{pkg.seasonNote}</p>}

                  <div className="package-price-bar mt-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{pkg.priceLabel || 'Starting from'}</p>
                      <p className="text-2xl font-bold text-brand-700 md:text-[1.65rem]">{pkg.price}</p>
                    </div>
                    <span className="max-w-[7rem] text-right text-xs font-medium leading-snug text-slate-500">{pkg.priceNote}</span>
                  </div>

                  <ul className="mt-4 flex-1 space-y-2 border-t border-slate-100 pt-4">
                    {(pkg.features || []).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="mt-0.5 text-emerald-600" aria-hidden>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                    <Link to="/contact" className="btn-outline text-center text-sm">Ask for Quote</Link>
                    <Link to="/booking" className="btn-primary text-center text-sm">Book Now</Link>
                  </div>
                </div>
              </article>
            </SectionReveal>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          Prices shown are starting rates in Bangladeshi Taka (BDT) and exclude personal expenses, travel insurance,
          and optional upgrades unless stated.
        </p>
        <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-slate-200 bg-white px-4 py-3">
          <PaymentStrip variant="light" />
        </div>
      </div>
    </section>
  );
}
