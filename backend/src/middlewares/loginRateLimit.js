import rateLimit from 'express-rate-limit';

/**
 * Stricter rate limit for login attempts — complements failed login logging.
 */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Try again later.' },
});

export default loginRateLimit;
