import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useHomeContent } from '../../context/HomeContentContext';
import SafeImage from '../common/SafeImage';
import { SectionReveal } from './motion';
import TrustReassurance from './TrustReassurance';

export default function PromoSlider() {
  const promo = useHomeContent('promo');
  const slides = promo?.slides || [];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const next = useCallback(() => {
    if (!slides.length) return;
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  const prev = () => {
    if (!slides.length) return;
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    if (paused || prefersReducedMotion || slides.length < 2) return undefined;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [paused, next, prefersReducedMotion, slides.length]);

  if (promo?.visible === false || !slides.length) return null;

  const slide = slides[index] || slides[0];
  const isFirstSlide = index === 0;

  const slideTransition = prefersReducedMotion
    ? { duration: 0.2 }
    : { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

  return (
    <section className="bg-slate-100 section-spacing" aria-label="Featured offers">
      <div className="container-page">
        <SectionReveal>
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="section-eyebrow">{promo.eyebrow || 'Current offers'}</p>
              <h2 className="section-title mt-2">{promo.title || 'Seasonal deals'}</h2>
            </div>
            <div className="flex gap-2 self-start sm:self-auto">
              <button type="button" onClick={prev} className="nav-arrow" aria-label="Previous offer">‹</button>
              <button type="button" onClick={next} className="nav-arrow" aria-label="Next offer">›</button>
            </div>
          </div>
        </SectionReveal>

        <div
          className="relative min-h-[340px] overflow-hidden rounded-2xl shadow-xl sm:min-h-[380px] md:min-h-[420px] md:rounded-3xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={slideTransition}
              className="absolute inset-0"
            >
              <SafeImage
                src={slide.image}
                fallbackKey="promo"
                alt=""
                aria-hidden="true"
                width={1200}
                height={800}
                className="h-full w-full object-cover"
                containerClassName="absolute inset-0 h-full w-full"
                aspectClass="h-full w-full"
                loading={isFirstSlide ? 'eager' : 'lazy'}
                fetchPriority={isFirstSlide ? 'high' : 'auto'}
                decoding="async"
              />
              <div className={`absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r ${slide.accent || 'from-brand-800/92 to-brand-950/92'}`} />
              <div className="relative flex h-full min-h-[340px] flex-col justify-end p-6 sm:min-h-[380px] sm:p-10 md:min-h-[420px] md:p-12">
                <span className="offer-badge w-fit">{slide.tag}</span>
                <h3 className="mt-4 max-w-2xl break-words text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl">
                  {slide.title}
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base md:text-lg">
                  {slide.subtitle}
                </p>
                {slide.href?.startsWith('/') ? (
                  <Link to={slide.href} className="btn-accent mt-6 w-full sm:w-fit">{slide.cta}</Link>
                ) : (
                  <a href={slide.href || '#packages'} className="btn-accent mt-6 w-full sm:w-fit">{slide.cta}</a>
                )}
                <TrustReassurance className="mt-4 max-w-md text-white/75" variant="dark" />
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1 md:bottom-6">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIndex(i)}
                className="pointer-events-auto flex h-11 w-11 items-center justify-center"
                aria-label={`Offer ${i + 1}: ${s.title}`}
                aria-current={i === index ? 'true' : undefined}
              >
                <span className={`block rounded-full transition-all duration-300 ${i === index ? 'h-2 w-8 bg-white' : 'h-2 w-2 bg-white/45 hover:bg-white/70'}`} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
