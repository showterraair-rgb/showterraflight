/** Client IP for rate-limit buckets (respects X-Forwarded-For behind nginx). */
export function rateLimitKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

export function isAuthApiRoute(req) {
  const url = req.originalUrl || req.url || '';
  return /\/auth\/(me|login|logout|otp\/)/.test(url);
}

export default rateLimitKey;
