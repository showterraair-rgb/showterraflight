import env from '../config/env.js';

/** Client IP for rate-limit buckets (nginx proxy + Cloudflare). */
export function rateLimitKey(req) {
  const cfIp = req.headers['cf-connecting-ip'];
  if (typeof cfIp === 'string' && cfIp.trim()) {
    return cfIp.trim();
  }
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

/** Logged-in admin/agent sessions should not share the anonymous API quota. */
export function isAuthenticatedRequest(req) {
  const adminToken = req.cookies?.[env.jwt.cookieName];
  const agentToken = req.cookies?.[env.jwt.agentCookieName];
  return Boolean(adminToken || agentToken);
}

export default rateLimitKey;
