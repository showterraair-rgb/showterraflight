import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useHomeContent } from '../../context/HomeContentContext';
import SafeImage from '../common/SafeImage';
import { SectionReveal } from './motion';

function Stars({ count }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5 text-amber-400" aria-hidden>
        {Array.from({ length: count }).map((_, i) => (
          <svg key={i} className="h-5 w-5 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-sm font-semibold text-slate-700">{count}.0</span>
      <span className="sr-only">{count} out of 5 stars</span>
    </div>
  );
}

export default function TestimonialsSection() {
  const section = useHomeContent('testimonials');
  const testimonials = section?.items || [];
  const [index, setIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  const next = useCallback(() => {
    if (!testimonials.length) return;
    setIndex((i) => (i + 1) % testimonials.length);
  }, [testimonials.length]);

  const prev = () => {
    if (!testimonials.length) return;
    setIndex((i) => (i - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    if (prefersReducedMotion || !testimonials.length) return undefined;
    const t = setInterval(next, 7000);
    return () => clearInterval(t);
  }, [next, prefersReducedMotion, testimonials.length]);

  if (section?.visible === false || !testimonials.length) return null;

  const t = testimonials[index];
  const transition = prefersReducedMotion ? { duration: 0.15 } : { duration: 0.35 };

  return (
    <section className="section-spacing" aria-label="Client reviews">
      <div className="container-page">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <p className="section-eyebrow">{section?.eyebrow || 'Client reviews'}</p>
          <h2 className="section-title mt-2">{section?.title}</h2>
          <p className="section-lead">{section?.subtitle}</p>
        </SectionReveal>

        <div className="relative mx-auto mt-10 max-w-3xl md:mt-12">
          <div className="absolute -left-2 top-1/2 z-10 hidden -translate-y-1/2 sm:block md:-left-14">
            <button type="button" onClick={prev} className="nav-arrow" aria-label="Previous review">
              ‹
            </button>
          </div>
          <div className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 sm:block md:-right-14">
            <button type="button" onClick={next} className="nav-arrow" aria-label="Next review">
              ›
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.blockquote
              key={t.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transition}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg md:rounded-3xl md:p-10"
            >
              <Stars count={t.rating} />
              <p className="mt-5 text-base leading-relaxed text-slate-700 md:mt-6 md:text-lg md:leading-relaxed">
                &ldquo;{t.text}&rdquo;
              </p>
              <footer className="mt-6 flex items-center gap-4 border-t border-slate-100 pt-6 md:mt-8">
                <SafeImage
                  src={t.avatar}
                  fallbackKey="person"
                  alt=""
                  width={150}
                  height={150}
                  className="rounded-full ring-2 ring-brand-100 md:h-14 md:w-14"
                  containerClassName="h-12 w-12 shrink-0 md:h-14 md:w-14"
                  aspectClass="h-12 w-12 rounded-full md:h-14 md:w-14"
                  loading="lazy"
                  decoding="async"
                />
                <div>
                  <cite className="not-italic text-base font-bold text-slate-900">{t.name}</cite>
                  <p className="text-sm text-slate-600">
                    {t.role}
                    {t.location ? ` · ${t.location}` : ''}
                  </p>
                  {t.trip && (
                    <p className="mt-0.5 text-xs font-medium text-brand-600">{t.trip}</p>
                  )}
                </div>
              </footer>
            </motion.blockquote>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-center gap-3 sm:hidden">
            <button type="button" onClick={prev} className="nav-arrow" aria-label="Previous review">
              ‹
            </button>
            <div className="flex gap-2">
              {testimonials.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all ${i === index ? 'w-7 bg-brand-600' : 'w-2 bg-slate-300'}`}
                  aria-label={`Review by ${item.name}`}
                  aria-current={i === index ? 'true' : undefined}
                />
              ))}
            </div>
            <button type="button" onClick={next} className="nav-arrow" aria-label="Next review">
              ›
            </button>
          </div>

          <div className="mt-4 hidden justify-center gap-2 sm:flex">
            {testimonials.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-7 bg-brand-600' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
                aria-label={`Review by ${item.name}`}
                aria-current={i === index ? 'true' : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
