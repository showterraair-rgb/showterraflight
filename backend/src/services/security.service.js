import LoginLog from '../models/LoginLog.js';
import AuditLog from '../models/AuditLog.js';
import SecuritySetting from '../models/SecuritySetting.js';
import User from '../models/User.js';
import { parsePaginationQuery, buildPaginationResponse } from '../utils/pagination.js';
import { getSecuritySettings, validatePasswordStrength } from '../utils/passwordPolicy.js';
import { logAudit } from './audit.service.js';
import ApiError from '../utils/ApiError.js';

export async function listLoginLogs(query) {
  const { page, limit, skip, sort } = parsePaginationQuery(query, 'createdAt');
  const filter = {};
  if (query.success !== undefined) filter.success = query.success === 'true';
  if (query.email) filter.email = new RegExp(query.email, 'i');

  const [items, total] = await Promise.all([
    LoginLog.find(filter)
      .populate('user', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    LoginLog.countDocuments(filter),
  ]);

  return {
    items: items.map((l) => ({
      id: l._id.toString(),
      email: l.email,
      userName: l.user?.name,
      userRole: l.user?.role,
      success: l.success,
      failureReason: l.failureReason,
      ipAddress: l.ipAddress,
      userAgent: l.userAgent,
      createdAt: l.createdAt,
    })),
    pagination: buildPaginationResponse({ page, limit, total }),
  };
}

export async function listAuditLogs(query) {
  const { page, limit, skip, sort } = parsePaginationQuery(query, 'createdAt');
  const filter = {};
  if (query.module) filter.module = query.module;
  if (query.action) filter.action = query.action;
  if (query.userId) filter.user = query.userId;

  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('user', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return {
    items: items.map((a) => ({
      id: a._id.toString(),
      action: a.action,
      module: a.module,
      entityType: a.entityType,
      entityId: a.entityId?.toString(),
      description: a.description,
      userName: a.user?.name,
      userEmail: a.user?.email,
      ipAddress: a.ipAddress,
      createdAt: a.createdAt,
    })),
    pagination: buildPaginationResponse({ page, limit, total }),
  };
}

export async function getSecurityOverview() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [failedLogins24h, successfulLogins24h, recentAudit, mfaReadyUsers, settings] = await Promise.all([
    LoginLog.countDocuments({ success: false, createdAt: { $gte: since24h } }),
    LoginLog.countDocuments({ success: true, createdAt: { $gte: since24h } }),
    AuditLog.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name').lean(),
    User.countDocuments({ isActive: true, role: 'admin' }),
    getSecuritySettings(),
  ]);

  return {
    failedLogins24h,
    successfulLogins24h,
    mfaReadyUsers,
    mfaEnabledAdmins: await User.countDocuments({ role: 'admin', mfaEnabled: true }),
    sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
    recentAudit: recentAudit.map((a) => ({
      action: a.action,
      module: a.module,
      description: a.description,
      userName: a.user?.name,
      createdAt: a.createdAt,
    })),
  };
}

export async function getSettings() {
  return getSecuritySettings();
}

export async function updateSettings(data, userId, req) {
  const allowed = [
    'minPasswordLength',
    'requireUppercase',
    'requireLowercase',
    'requireNumber',
    'requireSpecialChar',
    'sessionTimeoutMinutes',
    'maxLoginAttempts',
    'lockoutMinutes',
    'mfaRequiredForAdmin',
    'auditRetentionDays',
  ];

  const update = { updatedBy: userId };
  for (const key of allowed) {
    if (data[key] !== undefined) update[key] = data[key];
  }

  const settings = await SecuritySetting.findOneAndUpdate(
    { key: 'security' },
    update,
    { new: true, upsert: true }
  ).lean();

  await logAudit({
    action: 'update',
    module: 'security',
    entityType: 'SecuritySetting',
    description: 'Security settings updated',
    userId,
    req,
  });

  return settings;
}

export async function prepareMfa(userId) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  if (user.role !== 'admin') throw ApiError.forbidden('MFA setup is admin-only in this phase');

  user.mfaPending = true;
  user.mfaSecret = `MFA-PLACEHOLDER-${user._id}`;
  await user.save({ validateBeforeSave: false });

  return {
    mfaPending: true,
    message: 'MFA architecture ready. Integrate TOTP provider (e.g. speakeasy) in deployment phase.',
    qrPlaceholder: false,
  };
}

export { validatePasswordStrength };

export default {
  listLoginLogs,
  listAuditLogs,
  getSecurityOverview,
  getSettings,
  updateSettings,
  prepareMfa,
  validatePasswordStrength,
};
