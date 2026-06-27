import rateLimit from 'express-rate-limit';
import { rateLimitKey } from '../utils/rateLimitKey.js';

/**
 * Stricter rate limit for login / OTP — auth routes are excluded from the global limiter.
 */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: rateLimitKey,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many login attempts. Wait 15 minutes and try again.' },
});

export default loginRateLimit;
