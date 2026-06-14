/** Section-specific lazy-load placeholders — heights match real sections to limit layout shift */

const SIZES = {
  map: '36rem',
  testimonials: '28rem',
  gallery: '36rem',
  team: '34rem',
  trust: '28rem',
};

function FallbackShell({ minHeight, sectionClass = 'section-spacing', label }) {
  return (
    <div
      className={`${sectionClass} w-full`}
      style={{ minHeight }}
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default function SectionFallback({ minHeight = '12rem', sectionClass = 'section-spacing', label = 'Loading section' }) {
  return <FallbackShell minHeight={minHeight} sectionClass={sectionClass} label={label} />;
}

export function MapSectionFallback() {
  return <FallbackShell minHeight={SIZES.map} label="Loading destinations section" />;
}

export function TestimonialsSectionFallback() {
  return <FallbackShell minHeight={SIZES.testimonials} label="Loading client reviews" />;
}

export function GallerySectionFallback() {
  return <FallbackShell minHeight={SIZES.gallery} label="Loading travel gallery" />;
}

export function TeamSectionFallback() {
  return <FallbackShell minHeight={SIZES.team} label="Loading team section" />;
}

export function TrustSectionFallback() {
  return (
    <FallbackShell
      minHeight={SIZES.trust}
      sectionClass="py-16 md:py-20"
      label="Loading trust and payments"
    />
  );
}
