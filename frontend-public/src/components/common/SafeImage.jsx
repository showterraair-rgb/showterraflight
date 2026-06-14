import { useState } from 'react';
import { resolveImageUrl } from '../../utils/imageUtils';

/**
 * Image with onError fallback, fixed aspect container, and gradient placeholder.
 */
export default function SafeImage({
  src,
  alt = '',
  fallbackKey = 'default',
  className = '',
  containerClassName = '',
  aspectClass = '',
  showLabelOnFallback = false,
  label = '',
  ...props
}) {
  const primary = resolveImageUrl(src, fallbackKey);
  const fallback = resolveImageUrl(null, fallbackKey);
  const [currentSrc, setCurrentSrc] = useState(primary);
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    if (currentSrc !== fallback) {
      setCurrentSrc(fallback);
      setFailed(true);
      return;
    }
    setFailed(true);
  };

  const wrapperClass = [
    'relative overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300',
    aspectClass,
    containerClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClass || undefined}>
      <img
        {...props}
        src={currentSrc}
        alt={alt}
        className={`h-full w-full object-cover ${failed && showLabelOnFallback ? 'opacity-60' : ''} ${className}`}
        onError={handleError}
      />
      {failed && showLabelOnFallback && label && (
        <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-brand-950/80 to-transparent p-4">
          <p className="text-sm font-semibold text-white">{label}</p>
        </div>
      )}
    </div>
  );
}
