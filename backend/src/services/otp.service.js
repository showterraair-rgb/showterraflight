import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import OtpCode from '../models/OtpCode.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { sendSmtpEmail } from './email/smtp.provider.js';
import { sendBulkSmsBd } from './sms/bulksmsbd.provider.js';
import { getSmsSettingsRaw } from './notificationSettings.service.js';
import { resolveSmsConfig } from '../utils/smsConfig.js';
import { signToken, getCookieOptions } from '../utils/jwt.js';
import { resolveUserAccess } from './permissions.service.js';
import LoginLog from '../models/LoginLog.js';
import AuditLog from '../models/AuditLog.js';

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function normalizeIdentifier(value, channel) {
  const v = String(value || '').trim();
  if (channel === 'email') return v.toLowerCase();
  return v.replace(/\D/g, '');
}

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sanitizeUser(user) {
  const access = await resolveUserAccess(user);
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    staffId: user.staffId || '',
    role: user.role,
    roleLabel: access.roleLabel,
    permissions: access.permissions,
    fieldAccess: access.fieldAccess,
    department: user.department || '',
    designation: user.designation || '',
    lastLoginAt: user.lastLoginAt,
  };
}

async function sendOtpViaChannel(channel, identifier, code, userName) {
  const message = `Show Terra Air login code: ${code}. Valid for 10 minutes. Do not share.`;

  if (channel === 'email') {
    await sendSmtpEmail({
      to: identifier,
      subject: 'Your Show Terra Air login code',
      text: message,
    });
    return;
  }

  const raw = await getSmsSettingsRaw();
  const sms = resolveSmsConfig(raw);
  if (sms.isEnabled && sms.apiKey) {
    await sendBulkSmsBd({
      apiKey: sms.apiKey,
      senderId: sms.senderId,
      apiUrl: sms.apiUrl,
      to: identifier,
      message,
    });
  } else {
    console.log('[OTP:SMS:stub]', identifier, code);
  }
}

export async function requestStaffOtp({ email, phone }, ipAddress, userAgent) {
  const channel = email ? 'email' : phone ? 'phone' : null;
  if (!channel) throw ApiError.badRequest('Email or phone is required');

  const identifier = normalizeIdentifier(email || phone, channel);
  const userQuery = channel === 'email'
    ? { email: identifier }
    : { phone: new RegExp(identifier.slice(-10)) };

  const user = await User.findOne(userQuery);
  if (!user || !user.isActive) {
    throw ApiError.badRequest('No active staff account found for this contact');
  }

  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);

  await OtpCode.create({
    identifier,
    channel,
    codeHash,
    purpose: 'staff_login',
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    user: user._id,
  });

  await sendOtpViaChannel(channel, channel === 'email' ? user.email : user.phone, code, user.name);

  await LoginLog.create({
    user: user._id,
    email: user.email,
    success: false,
    failureReason: 'OTP requested',
    ipAddress,
    userAgent,
  });

  return {
    message: `Verification code sent via ${channel}`,
    channel,
    expiresInMinutes: 10,
    maskedTarget: channel === 'email'
      ? user.email.replace(/(.{2}).+(@.+)/, '$1***$2')
      : `***${String(user.phone).slice(-4)}`,
  };
}

export async function verifyStaffOtp({ email, phone, code }, ipAddress, userAgent) {
  const channel = email ? 'email' : phone ? 'phone' : null;
  if (!channel || !code) throw ApiError.badRequest('Contact and code are required');

  const identifier = normalizeIdentifier(email || phone, channel);
  const otp = await OtpCode.findOne({
    identifier,
    purpose: 'staff_login',
    verified: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 }).select('+codeHash');

  if (!otp) throw ApiError.badRequest('Code expired or not found. Request a new one.');

  if (otp.attempts >= MAX_ATTEMPTS) {
    throw ApiError.badRequest('Too many attempts. Request a new code.');
  }

  const valid = await bcrypt.compare(String(code), otp.codeHash);
  otp.attempts += 1;
  if (!valid) {
    await otp.save();
    throw ApiError.badRequest('Invalid verification code');
  }

  otp.verified = true;
  await otp.save();

  const user = await User.findById(otp.user);
  if (!user || !user.isActive) throw ApiError.unauthorized('Account inactive');

  user.lastLoginAt = new Date();
  user.lastActivityAt = new Date();
  await user.save({ validateBeforeSave: false });

  await LoginLog.create({ user: user._id, email: user.email, success: true, ipAddress, userAgent });
  await AuditLog.create({
    action: 'login',
    module: 'auth',
    description: `${user.name} logged in via OTP (${channel})`,
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

export default { requestStaffOtp, verifyStaffOtp };
