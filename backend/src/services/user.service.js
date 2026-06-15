import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { ROLES } from '../config/constants.js';
import {
  parsePaginationQuery,
  buildPaginationResponse,
  buildSearchFilter,
} from '../utils/pagination.js';
import { logAudit } from './audit.service.js';

function formatUser(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    phone: doc.phone || '',
    role: doc.role,
    isActive: doc.isActive,
    lastLoginAt: doc.lastLoginAt,
    lastActivityAt: doc.lastActivityAt,
    mfaEnabled: Boolean(doc.mfaEnabled),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function countActiveAdmins(excludeId = null) {
  const filter = { role: ROLES.ADMIN, isActive: true };
  if (excludeId) filter._id = { $ne: excludeId };
  return User.countDocuments(filter);
}

async function assertCanModifyUser(targetId, data, actorId) {
  const target = await User.findById(targetId);
  if (!target) throw ApiError.notFound('User not found');

  const isSelf = targetId === actorId;
  const demotingAdmin = target.role === ROLES.ADMIN && data.role && data.role !== ROLES.ADMIN;
  const deactivating = data.isActive === false && target.isActive;

  if (isSelf && (demotingAdmin || deactivating)) {
    throw ApiError.badRequest('You cannot deactivate or demote your own account');
  }

  if (target.role === ROLES.ADMIN && target.isActive && (demotingAdmin || deactivating)) {
    const remaining = await countActiveAdmins(targetId);
    if (remaining === 0) {
      throw ApiError.badRequest('Cannot remove or demote the last active administrator');
    }
  }

  return target;
}

export async function listUsers(query) {
  const { page, limit, skip, sort } = parsePaginationQuery(query);
  const filter = { ...buildSearchFilter(query.search, ['name', 'email', 'phone']) };

  if (query.role) filter.role = query.role;
  if (query.isActive === 'true') filter.isActive = true;
  if (query.isActive === 'false') filter.isActive = false;

  const [items, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return {
    items: items.map(formatUser),
    pagination: buildPaginationResponse({ page, limit, total }),
  };
}

export async function getUserById(id) {
  const user = await User.findById(id).lean();
  if (!user) throw ApiError.notFound('User not found');
  return formatUser(user);
}

export async function createUser(data, userId, req) {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) throw ApiError.badRequest('A user with this email already exists');

  const user = await User.create({
    name: data.name,
    email: data.email,
    phone: data.phone || undefined,
    password: data.password,
    role: data.role || ROLES.EXECUTIVE,
    createdBy: userId,
  });

  await logAudit({
    action: 'create',
    module: 'users',
    entityType: 'User',
    entityId: user._id,
    description: `Created user ${user.email} (${user.role})`,
    userId,
    req,
  });

  return formatUser(user.toObject());
}

export async function updateUser(id, data, userId, req) {
  const user = await assertCanModifyUser(id, data, userId);

  if (data.email && data.email !== user.email) {
    const dup = await User.findOne({ email: data.email.toLowerCase(), _id: { $ne: id } });
    if (dup) throw ApiError.badRequest('Email already in use');
    user.email = data.email;
  }

  if (data.name) user.name = data.name;
  if (data.phone !== undefined) user.phone = data.phone || undefined;
  if (data.role) user.role = data.role;
  if (data.isActive !== undefined) user.isActive = data.isActive;
  if (data.password) user.password = data.password;

  await user.save();

  await logAudit({
    action: 'update',
    module: 'users',
    entityType: 'User',
    entityId: user._id,
    description: `Updated user ${user.email}`,
    userId,
    req,
  });

  return formatUser(user.toObject());
}

export async function deactivateUser(id, userId, req) {
  return updateUser(id, { isActive: false }, userId, req);
}

export default {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
};
