/** Local static fallbacks — never depend on external CDNs for production */

export const HOME_IMAGE_FALLBACKS = {
  hero: '/uploads/cms/home/hero.jpg',
  promo: '/uploads/cms/home/umrah.jpg',
  destination: '/uploads/cms/home/dubai.jpg',
  gallery: '/uploads/cms/home/gallery-dubai.jpg',
  person: '/uploads/cms/home/team-1.jpg',
  office: '/uploads/cms/home/office.jpg',
  sky: '/uploads/cms/home/sky.jpg',
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
