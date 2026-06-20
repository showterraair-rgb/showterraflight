import User from '../models/User.js';
import LoginLog from '../models/LoginLog.js';
import AuditLog from '../models/AuditLog.js';
import { resolveUserAccess } from './permissions.service.js';
import { signToken, getCookieOptions } from '../utils/jwt.js';
import { getSecuritySettings, validatePasswordStrength } from '../utils/passwordPolicy.js';
import ApiError from '../utils/ApiError.js';
import env from '../config/env.js';

async function sanitizeUser(user) {
  const access = await resolveUserAccess(user);
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    roleLabel: access.roleLabel,
    permissions: access.permissions,
    fieldAccess: access.fieldAccess,
    department: user.department || '',
    designation: user.designation || '',
    lastLoginAt: user.lastLoginAt,
    mfaEnabled: user.mfaEnabled || false,
    mfaPending: user.mfaPending || false,
  };
}

export async function login({ email, password, ipAddress, userAgent }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !user.isActive) {
    await LoginLog.create({
      email,
      success: false,
      failureReason: 'Invalid credentials or inactive account',
      ipAddress,
      userAgent,
    });
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    await LoginLog.create({
      user: user._id,
      email,
      success: false,
      failureReason: 'Incorrect password',
      ipAddress,
      userAgent,
    });
    throw ApiError.unauthorized('Invalid email or password');
  }

  user.lastLoginAt = new Date();
  user.lastActivityAt = new Date();
  await user.save({ validateBeforeSave: false });

  await LoginLog.create({
    user: user._id,
    email,
    success: true,
    ipAddress,
    userAgent,
  });

  await AuditLog.create({
    action: 'login',
    module: 'auth',
    description: `${user.name} logged in`,
    user: user._id,
    ipAddress,
    userAgent,
  });

  const token = signToken({ userId: user._id.toString(), role: user.role });

  return {
    user: await sanitizeUser(user),
    token,
    cookieOptions: getCookieOptions(),
  };
}

export async function logout(userId, ipAddress, userAgent) {
  if (userId) {
    await AuditLog.create({
      action: 'logout',
      module: 'auth',
      description: 'User logged out',
      user: userId,
      ipAddress,
      userAgent,
    });
  }

  return {
    cookieOptions: {
      ...getCookieOptions(),
      maxAge: 0,
    },
  };
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Account inactive or not found');
  }

  return sanitizeUser(user);
}

export async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  const settings = await getSecuritySettings();
  const policyErrors = validatePasswordStrength(newPassword, settings);
  if (policyErrors.length) {
    throw ApiError.badRequest(policyErrors.join('. '));
  }

  user.password = newPassword;
  await user.save();
  await AuditLog.create({
    action: 'update',
    module: 'auth',
    entityType: 'User',
    entityId: user._id,
    description: 'Password changed',
    user: user._id,
  });

  return { message: 'Password updated successfully' };
}

export function getClearCookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookie.secure,
    sameSite: env.cookie.sameSite,
    maxAge: 0,
    path: '/',
  };
}

export default { login, logout, getCurrentUser, changePassword };
