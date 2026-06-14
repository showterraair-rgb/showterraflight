import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useHomeContent } from '../../context/HomeContentContext';
import SafeImage from '../common/SafeImage';
import { FadeIn, SectionReveal } from './motion';

export default function GallerySection() {
  const section = useHomeContent('gallery');
  const filters = section?.filters || [];
  const allItems = section?.items || [];
  const [filter, setFilter] = useState('all');
  const [lightbox, setLightbox] = useState(null);
  const prefersReducedMotion = useReducedMotion();

  const items = filter === 'all' ? allItems : allItems.filter((g) => g.category === filter);

  const closeLightbox = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    if (!lightbox) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [lightbox, closeLightbox]);

  if (section?.visible === false || !allItems.length) return null;

  const figureMotion = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, scale: 0.98 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0 } };

  return (
    <section id="gallery" className="bg-slate-50 section-spacing">
      <div className="container-page">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <p className="section-eyebrow">{section?.eyebrow || 'Travel gallery'}</p>
          <h2 className="section-title mt-2">{section?.title || 'Snapshots from our client trips'}</h2>
          <p className="section-lead">{section?.subtitle}</p>
        </SectionReveal>

        <FadeIn className="mt-8 flex flex-wrap justify-center gap-2 px-1">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`filter-pill ${filter === f.id ? 'filter-pill-active' : ''}`}
              aria-pressed={filter === f.id}
            >
              {f.label}
            </button>
          ))}
        </FadeIn>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLightbox(item)}
              className="group overflow-hidden rounded-xl border border-slate-200/80 bg-white text-left shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:rounded-2xl"
            >
              <div className="aspect-square overflow-hidden sm:aspect-[4/3]">
                <SafeImage
                  src={item.image}
                  fallbackKey="gallery"
                  alt={item.title}
                  width={600}
                  height={600}
                  className="transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  containerClassName="h-full w-full"
                  aspectClass="h-full w-full"
                  showLabelOnFallback
                  label={item.title}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="px-3 py-2.5 sm:px-4 sm:py-3">
                <p className="line-clamp-2 text-xs font-semibold text-slate-800 sm:text-sm">{item.title}</p>
                {item.subtitle && (
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500 sm:text-xs">{item.subtitle}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.1 : 0.25 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-end bg-black/92 p-4 pb-6 sm:items-center sm:justify-center sm:pb-4"
            onClick={closeLightbox}
            role="dialog"
            aria-modal="true"
            aria-label={lightbox.title}
          >
            <button
              type="button"
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl text-white transition hover:bg-white/20"
              onClick={closeLightbox}
              aria-label="Close preview"
            >
              ×
            </button>
            <motion.figure
              {...figureMotion}
              transition={{ duration: prefersReducedMotion ? 0.1 : 0.25 }}
              className="w-full max-w-4xl px-1 sm:px-0"
              onClick={(e) => e.stopPropagation()}
            >
              <SafeImage
                src={lightbox.image}
                fallbackKey="gallery"
                alt={lightbox.title}
                className="mx-auto max-h-[55vh] w-auto max-w-full rounded-lg object-contain sm:max-h-[70vh]"
                containerClassName="mx-auto flex max-h-[55vh] items-center justify-center sm:max-h-[70vh]"
              />
              <figcaption className="mt-3 text-center sm:mt-4">
                <p className="text-sm font-semibold text-white sm:text-base">{lightbox.title}</p>
                {lightbox.subtitle && (
                  <p className="mt-1 text-xs text-white/70 sm:text-sm">{lightbox.subtitle}</p>
                )}
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
