import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCompany } from '../../context/CompanyContext';
import { useHomeContent } from '../../context/HomeContentContext';
import SafeImage from '../common/SafeImage';
import { getPhoneDigits, getWhatsAppDigits } from '../../utils/companyHelpers';

function CtaButton({ slide, type, wa, phone, className }) {
  const isPrimary = type === 'primary';
  const text = isPrimary ? slide.primaryCtaText : slide.secondaryCtaText;
  const link = isPrimary ? slide.primaryCtaLink : slide.secondaryCtaLink;
  if (!text) return null;

  const btnClass = isPrimary ? 'btn-accent shadow-glow btn-lift' : 'btn-outline-light btn-lift';

  if (link === 'whatsapp') {
    return (
      <a
        href={`https://wa.me/88${wa}?text=Hello%20Show%20Terra%20Flight,%20I%20need%20help%20planning%20a%20trip.`}
        target="_blank"
        rel="noreferrer"
        className={`${btnClass} ${className}`}
      >
        {text}
      </a>
    );
  }

  if (link === 'tel') {
    return (
      <a href={`tel:+88${phone}`} className={`${btnClass} ${className}`}>
        {text}
      </a>
    );
  }

  if (link?.startsWith('/') && !link.includes('#')) {
    return (
      <Link to={link} className={`${btnClass} ${className}`}>
        {text}
      </Link>
    );
  }

  return (
    <a href={link || '#'} className={`${btnClass} ${className}`}>
      {text}
    </a>
  );
}

export default function HeroSlider() {
  const hero = useHomeContent('hero');
  const { company } = useCompany();
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef(null);

  const slides = (hero?.slides || []).filter((s) => s.visible !== false);
  const autoplayMs = hero?.autoplayMs || 6000;
  const wa = getWhatsAppDigits(company);
  const phone = getPhoneDigits(company);

  const next = useCallback(() => {
    if (!slides.length) return;
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    if (!slides.length) return;
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (index >= slides.length && slides.length > 0) setIndex(0);
  }, [slides.length, index]);

  useEffect(() => {
    if (paused || prefersReducedMotion || slides.length < 2) return undefined;
    const t = setInterval(next, autoplayMs);
    return () => clearInterval(t);
  }, [paused, next, prefersReducedMotion, slides.length, autoplayMs]);

  const onTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    if (touchStart.current == null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
    touchStart.current = null;
  };

  if (hero?.visible === false || !slides.length) return null;

  const slide = slides[index] || slides[0];
  const alignClass = slide.textAlign === 'center' ? 'text-center items-center' : 'text-left items-start';
  const overlay = Math.min(1, Math.max(0, Number(slide.overlayOpacity) || 0.85));
  const transition = prefersReducedMotion ? { duration: 0.2 } : { duration: 0.55, ease: [0.22, 1, 0.36, 1] };

  return (
    <section
      id="hero"
      className="hero-slider relative min-h-[92vh] overflow-hidden bg-brand-950"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 md:hidden">
            <SafeImage
              src={slide.mobileImage || slide.image}
              fallbackKey="hero"
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
              containerClassName="h-full w-full"
              loading="eager"
              fetchPriority="high"
            />
          </div>
          <div className="absolute inset-0 hidden md:block">
            <SafeImage
              src={slide.image}
              fallbackKey="hero"
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
              containerClassName="h-full w-full"
              loading="eager"
              fetchPriority="high"
            />
          </div>
          <div
            className="absolute inset-0 bg-gradient-to-br from-brand-950/85 via-brand-900/55 to-brand-800/45"
            style={{ opacity: overlay }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,_rgba(56,189,248,0.12),_transparent_45%)]" />
        </motion.div>
      </AnimatePresence>

      <div className="container-page relative z-10 flex min-h-[92vh] flex-col justify-center py-24 lg:py-28">
        {(hero.credibility?.length > 0) && (
          <div className="credibility-strip mb-6 sm:mb-8 animate-fade-in">
            {hero.credibility.map((item) => (
              <div key={item.label} className="credibility-stat interactive-stat">
                <p className="text-lg font-bold text-white sm:text-xl">{item.value}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-400 sm:text-xs">{item.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${slide.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={transition}
              className={`flex flex-col ${alignClass}`}
            >
              {slide.badge && (
                <span className="offer-badge mb-4 w-fit bg-white/10 text-sky-200 backdrop-blur-sm">{slide.badge}</span>
              )}
              {slide.eyebrow && <p className="section-eyebrow text-sky-300/90">{slide.eyebrow}</p>}
              <h1 className="mt-3 break-words text-[1.85rem] font-bold leading-[1.14] tracking-tight text-white sm:text-4xl lg:text-[3.1rem]">
                {slide.title}
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-300 md:text-base lg:text-lg">
                {slide.subtitle}
              </p>
              {(slide.trustPoints?.length > 0) && (
                <ul className="mt-6 space-y-2">
                  {slide.trustPoints.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm text-slate-200 md:text-[15px]">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <CtaButton slide={slide} type="primary" wa={wa} phone={phone} className="w-full text-center sm:w-auto" />
                <CtaButton slide={slide} type="secondary" wa={wa} phone={phone} className="w-full text-center sm:w-auto" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button type="button" onClick={prev} className="hero-nav hero-nav-prev" aria-label="Previous slide">‹</button>
          <button type="button" onClick={next} className="hero-nav hero-nav-next" aria-label="Next slide">›</button>
          <div className="hero-dots">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIndex(i)}
                className="hero-dot-btn"
                aria-label={`Slide ${i + 1}: ${s.title}`}
                aria-current={i === index ? 'true' : undefined}
              >
                <span className={`hero-dot ${i === index ? 'hero-dot-active' : ''}`} />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
