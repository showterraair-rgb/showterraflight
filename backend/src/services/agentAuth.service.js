import crypto from 'crypto';
import Agent from '../models/Agent.js';
import ApiError from '../utils/ApiError.js';
import { signToken, getCookieOptions } from '../utils/jwt.js';
import { validatePasswordStrength } from '../utils/passwordPolicy.js';
import env from '../config/env.js';

function sanitizeAgent(agent) {
  return {
    id: agent._id.toString(),
    agentId: agent.agentId,
    companyName: agent.companyName,
    contactPerson: agent.contactPerson,
    email: agent.email,
    phone: agent.phone || '',
    whatsapp: agent.whatsapp || '',
    address: agent.address || '',
    city: agent.city || '',
    country: agent.country || 'Bangladesh',
    agentType: agent.agentType,
    creditLimit: agent.creditLimit,
    currentBalance: agent.currentBalance,
    isActive: agent.isActive,
    lastLoginAt: agent.lastLoginAt,
    createdAt: agent.createdAt,
  };
}

export async function agentLogin({ email, password }) {
  const agent = await Agent.findOne({ email: email.toLowerCase() }).select('+password');

  if (!agent || !agent.isActive) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isMatch = await agent.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  agent.lastLoginAt = new Date();
  agent.lastActivityAt = new Date();
  await agent.save({ validateBeforeSave: false });

  const token = signToken({ agentId: agent._id.toString(), type: 'agent' });

  return {
    agent: sanitizeAgent(agent),
    token,
    cookieOptions: getCookieOptions(),
  };
}

export async function agentForgotPassword(email) {
  const agent = await Agent.findOne({ email: email.toLowerCase(), isActive: true });
  if (!agent) {
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  const resetToken = agent.createPasswordResetToken();
  await agent.save({ validateBeforeSave: false });

  const resetUrl = `${env.cors.agentUrl}/reset-password?token=${resetToken}`;

  // Email integration — log in dev; production should use notification service
  if (!env.isProduction) {
    console.info('[agent] Password reset URL:', resetUrl);
  }

  return { message: 'If that email exists, a reset link has been sent.', resetUrl: env.isProduction ? undefined : resetUrl };
}

export async function agentResetPassword({ token, password }) {
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const agent = await Agent.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+password +resetPasswordToken +resetPasswordExpires');

  if (!agent) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  validatePasswordStrength(password);
  agent.password = password;
  agent.resetPasswordToken = undefined;
  agent.resetPasswordExpires = undefined;
  await agent.save();

  return { message: 'Password updated successfully' };
}

export async function getAgentProfile(agentId) {
  const agent = await Agent.findById(agentId).lean();
  if (!agent) throw ApiError.notFound('Agent not found');
  return sanitizeAgent(agent);
}

export async function updateAgentProfile(agentId, data) {
  const agent = await Agent.findById(agentId);
  if (!agent) throw ApiError.notFound('Agent not found');

  if (data.companyName) agent.companyName = data.companyName;
  if (data.contactPerson) agent.contactPerson = data.contactPerson;
  if (data.phone !== undefined) agent.phone = data.phone;
  if (data.whatsapp !== undefined) agent.whatsapp = data.whatsapp || '';
  if (data.address !== undefined) agent.address = data.address;
  if (data.city !== undefined) agent.city = data.city;
  if (data.country !== undefined) agent.country = data.country;

  await agent.save();
  return sanitizeAgent(agent.toObject());
}

export async function changeAgentPassword(agentId, { currentPassword, newPassword }) {
  const agent = await Agent.findById(agentId).select('+password');
  if (!agent) throw ApiError.notFound('Agent not found');

  const isMatch = await agent.comparePassword(currentPassword);
  if (!isMatch) throw ApiError.badRequest('Current password is incorrect');

  validatePasswordStrength(newPassword);
  agent.password = newPassword;
  await agent.save();

  return { message: 'Password changed successfully' };
}

export { sanitizeAgent };

export default {
  agentLogin,
  agentForgotPassword,
  agentResetPassword,
  getAgentProfile,
  updateAgentProfile,
  changeAgentPassword,
};
