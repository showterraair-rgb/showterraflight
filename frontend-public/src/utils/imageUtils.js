/** Local static fallbacks — never depend on external CDNs for production */

export const HOME_IMAGE_FALLBACKS = {
  hero: '/images/home/hero.svg',
  promo: '/images/home/promo.svg',
  destination: '/images/home/destination.svg',
  gallery: '/images/home/gallery.svg',
  person: '/images/home/person.svg',
  office: '/images/home/office.svg',
  sky: '/images/home/sky.svg',
  default: '/images/home/destination.svg',
};

/**
 * Normalize image URLs from CMS, uploads, or static paths.
 */
export function resolveImageUrl(src, fallbackKey = 'default') {
  const fallback = HOME_IMAGE_FALLBACKS[fallbackKey] || HOME_IMAGE_FALLBACKS.default;

  if (src == null || src === '') return fallback;

  const value = String(src).trim();
  if (!value) return fallback;

  if (value.startsWith('/images/') || value.startsWith('/uploads/')) {
    return value;
  }

  if (value.startsWith('uploads/')) {
    return `/${value}`;
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  if (value.startsWith('images/')) {
    return `/${value}`;
  }

  return fallback;
}

export default { HOME_IMAGE_FALLBACKS, resolveImageUrl };
