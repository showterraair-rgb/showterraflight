/**
 * Derive an embeddable iframe URL from common live platforms.
 * Returns empty string when the URL cannot be converted safely.
 */

export function deriveEmbedUrl(platform, streamUrl = '', existingEmbed = '') {
  if (existingEmbed && /^https?:\/\//i.test(existingEmbed)) {
    return existingEmbed.trim();
  }
  const url = (streamUrl || '').trim();
  if (!url) return '';

  if (platform === 'youtube' || /youtube\.com|youtu\.be/i.test(url)) {
    const id = extractYoutubeId(url);
    if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
  }

  if (platform === 'facebook' || /facebook\.com|fb\.watch/i.test(url)) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=true`;
  }

  // HLS or direct video page — caller may use native player; keep URL as embed fallback
  if (/\.m3u8(\?|$)/i.test(url) || platform === 'custom') {
    return url;
  }

  return '';
}

export function extractYoutubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.replace(/^\//, '').split('/')[0] || null;
    }
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    const embed = u.pathname.match(/\/embed\/([^/?]+)/);
    if (embed) return embed[1];
    const live = u.pathname.match(/\/live\/([^/?]+)/);
    if (live) return live[1];
  } catch {
    return null;
  }
  return null;
}

export default { deriveEmbedUrl, extractYoutubeId };
