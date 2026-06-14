import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export function signToken(payload) {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwt.secret);
}

export function getCookieOptions() {
  const maxAgeMs = parseExpiresIn(env.jwt.expiresIn);

  return {
    httpOnly: true,
    secure: env.cookie.secure,
    sameSite: env.cookie.sameSite,
    maxAge: maxAgeMs,
    path: '/',
  };
}

function parseExpiresIn(expiresIn) {
  if (typeof expiresIn === 'number') return expiresIn * 1000;

  const match = String(expiresIn).match(/^(\d+)([smhd])$/);
  if (!match) return 8 * 60 * 60 * 1000;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * multipliers[unit];
}

export default { signToken, verifyToken, getCookieOptions };
