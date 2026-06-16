import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useCompany } from '../../context/CompanyContext';
import { useHomeContent } from '../../context/HomeContentContext';
import SafeImage from '../common/SafeImage';
import { getWhatsAppDigits } from '../../utils/companyHelpers';

export default function HeroSection() {
  const { company } = useCompany();
  const hero = useHomeContent('hero');
  const prefersReducedMotion = useReducedMotion();

  if (hero?.visible === false) return null;

  const headline = hero?.title || '';
  const subline = hero?.subtitle || '';

  const wa = getWhatsAppDigits(company);
  const credibility = hero?.credibility || [];
  const trustPoints = hero?.trustPoints || [];

  const fade = (delay = 0) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay },
        };

  return (
    <section id="hero" className="relative min-h-[90vh] overflow-hidden bg-brand-950 lg:min-h-[92vh]">
      <div className="absolute inset-0">
        <SafeImage
          src={hero?.image}
          fallbackKey="hero"
          alt=""
          aria-hidden="true"
          width={1920}
          height={1280}
          className="h-full w-full object-cover opacity-35"
          containerClassName="h-full w-full"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950/96 via-brand-900/88 to-brand-800/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,_rgba(56,189,248,0.14),_transparent_45%)]" />
      </div>

      <div className="container-page relative z-10 flex min-h-[90vh] flex-col justify-center py-24 lg:min-h-[92vh] lg:py-28">
        {credibility.length > 0 && (
          <motion.div {...fade(0)} className="credibility-strip mb-6 sm:mb-8 lg:mb-10">
            {credibility.map((item) => (
              <div key={item.label} className="credibility-stat">
                <p className="text-lg font-bold text-white sm:text-xl">{item.value}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-400 sm:text-xs">{item.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        <div className="max-w-3xl">
          <div>
            {hero?.eyebrow && (
              <motion.p {...fade(0.04)} className="section-eyebrow text-sky-300/90">
                {hero.eyebrow}
              </motion.p>
            )}

            <motion.h1
              {...fade(0.1)}
              className="mt-3 break-words text-[1.85rem] font-bold leading-[1.14] tracking-tight text-white sm:text-4xl lg:text-[3.1rem]"
            >
              {headline}
            </motion.h1>

            <motion.p
              {...fade(0.16)}
              className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-300 md:text-base lg:text-lg"
            >
              {subline}
            </motion.p>

            {trustPoints.length > 0 && (
              <motion.ul {...fade(0.22)} className="mt-6 space-y-2">
                {trustPoints.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-slate-200 md:text-[15px]">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{point}</span>
                  </li>
                ))}
              </motion.ul>
            )}

            <motion.div {...fade(0.28)} className="mt-8 border-t border-white/10 pt-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Your next step</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link to="/booking" className="btn-accent shadow-glow w-full text-center sm:w-auto">
                  Book Your Ticket
                </Link>
                <a href="#packages" className="btn-outline-light w-full text-center sm:w-auto">
                  Explore Packages
                </a>
                <a
                  href={`https://wa.me/88${wa}?text=Hello%20Show%20Terra%20Flight,%20I%20need%20help%20planning%20a%20trip.`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-whatsapp w-full text-center sm:inline-flex sm:w-auto"
                >
                  Talk on WhatsApp
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
