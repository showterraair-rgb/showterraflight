import User from '../models/User.js';
import env from '../config/env.js';
import { verifyToken } from '../utils/jwt.js';
import ApiError from '../utils/ApiError.js';
import { ROLE_PERMISSIONS } from '../config/permissions.js';

export async function authenticate(req, _res, next) {
  const token = req.cookies?.[env.jwt.cookieName];

  if (!token) {
    return next(ApiError.unauthorized('Authentication required'));
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return next(ApiError.unauthorized('Invalid or expired session'));
  }

  const user = await User.findById(decoded.userId).select('+password');

  if (!user || !user.isActive) {
    return next(ApiError.unauthorized('Account inactive or not found'));
  }

  if (user.passwordChangedAt && decoded.iat) {
    const changedAt = Math.floor(user.passwordChangedAt.getTime() / 1000);
    if (changedAt > decoded.iat) {
      return next(ApiError.unauthorized('Session expired. Please login again'));
    }
  }

  if (user.lastActivityAt && env.inactivityTimeoutMinutes > 0) {
    const inactiveMs = Date.now() - new Date(user.lastActivityAt).getTime();
    const timeoutMs = env.inactivityTimeoutMinutes * 60 * 1000;
    if (inactiveMs > timeoutMs) {
      return next(ApiError.unauthorized('Session timed out due to inactivity'));
    }
  }

  user.lastActivityAt = new Date();
  await user.save({ validateBeforeSave: false });

  req.user = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: ROLE_PERMISSIONS[user.role] || [],
  };

  next();
}

export default authenticate;
