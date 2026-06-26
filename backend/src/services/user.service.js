import User from '../models/User.js';
import Role from '../models/Role.js';
import ApiError from '../utils/ApiError.js';
import { ROLES } from '../config/constants.js';
import {
  parsePaginationQuery,
  buildPaginationResponse,
  buildSearchFilter,
} from '../utils/pagination.js';
import { logAudit } from './audit.service.js';
import { PERMISSIONS } from '../config/permissions.js';
import { generateStaffId } from './staffId.service.js';

function docUrl(path) {
  if (!path) return '';
  return `/uploads/${String(path).replace(/^uploads\//, '')}`;
}

function formatUser(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    phone: doc.phone || '',
    staffId: doc.staffId || '',
    jobRegistrationNumber: doc.jobRegistrationNumber || '',
    nidUrl: docUrl(doc.nidFilePath),
    nidFileName: doc.nidFileName || '',
    schoolCertificateUrl: docUrl(doc.schoolCertificatePath),
    schoolCertificateFileName: doc.schoolCertificateFileName || '',
    otherDocumentUrl: docUrl(doc.otherDocumentPath),
    otherDocumentFileName: doc.otherDocumentFileName || '',
    role: doc.role,
    department: doc.department || '',
    designation: doc.designation || '',
    notes: doc.notes || '',
    permissionOverrides: doc.permissionOverrides || { grants: [], denies: [] },
    isActive: doc.isActive,
    lastLoginAt: doc.lastLoginAt,
    lastActivityAt: doc.lastActivityAt,
    mfaEnabled: Boolean(doc.mfaEnabled),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function snapshotUser(user) {
  return {
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    department: user.department,
    designation: user.designation,
    isActive: user.isActive,
    permissionOverrides: user.permissionOverrides,
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

async function linkRoleRef(user) {
  const roleDoc = await Role.findOne({ name: user.role }).select('_id');
  if (roleDoc) user.roleRef = roleDoc._id;
}

function validateOverrides(overrides) {
  if (!overrides) return { grants: [], denies: [] };
  const grants = (overrides.grants || []).filter((p) => PERMISSIONS[p] || p === '*');
  const denies = (overrides.denies || []).filter((p) => PERMISSIONS[p] || p === '*');
  return { grants, denies };
}

export async function listUsers(query) {
  const { page, limit, skip, sort } = parsePaginationQuery(query);
  const filter = { ...buildSearchFilter(query.search, ['name', 'email', 'phone', 'department', 'designation', 'staffId', 'jobRegistrationNumber']) };

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

  const user = new User({
    name: data.name,
    email: data.email,
    phone: data.phone || undefined,
    staffId: data.staffId || await generateStaffId(),
    jobRegistrationNumber: data.jobRegistrationNumber || '',
    password: data.password,
    role: data.role || ROLES.SALES_EXECUTIVE,
    department: data.department || '',
    designation: data.designation || '',
    notes: data.notes || '',
    permissionOverrides: validateOverrides(data.permissionOverrides),
    createdBy: userId,
  });

  await linkRoleRef(user);
  await user.save();

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
  const before = snapshotUser(user);

  if (data.email && data.email !== user.email) {
    const dup = await User.findOne({ email: data.email.toLowerCase(), _id: { $ne: id } });
    if (dup) throw ApiError.badRequest('Email already in use');
    user.email = data.email;
  }

  if (data.name) user.name = data.name;
  if (data.phone !== undefined) user.phone = data.phone || undefined;
  if (data.jobRegistrationNumber !== undefined) user.jobRegistrationNumber = data.jobRegistrationNumber || '';
  if (data.role) user.role = data.role;
  if (data.department !== undefined) user.department = data.department || '';
  if (data.designation !== undefined) user.designation = data.designation || '';
  if (data.notes !== undefined) user.notes = data.notes || '';
  if (data.permissionOverrides !== undefined) {
    user.permissionOverrides = validateOverrides(data.permissionOverrides);
  }
  if (data.isActive !== undefined) user.isActive = data.isActive;
  if (data.password) user.password = data.password;

  if (data.role) await linkRoleRef(user);

  await user.save();

  const after = snapshotUser(user);
  const statusChanged = before.isActive !== after.isActive;
  const roleChanged = before.role !== after.role;

  await logAudit({
    action: 'update',
    module: 'users',
    entityType: 'User',
    entityId: user._id,
    description: statusChanged
      ? `User ${user.email} ${after.isActive ? 'enabled' : 'disabled'}`
      : roleChanged
        ? `User ${user.email} role changed to ${after.role}`
        : `Updated user ${user.email}`,
    userId,
    req,
    changes: { before, after },
  });

  return formatUser(user.toObject());
}

export async function deactivateUser(id, userId, req) {
  return updateUser(id, { isActive: false }, userId, req);
}

export async function setUserActive(id, isActive, userId, req) {
  return updateUser(id, { isActive }, userId, req);
}

const STAFF_DOC_FIELDS = {
  nid: { path: 'nidFilePath', name: 'nidFileName' },
  school_certificate: { path: 'schoolCertificatePath', name: 'schoolCertificateFileName' },
  other: { path: 'otherDocumentPath', name: 'otherDocumentFileName' },
};

export async function uploadStaffDocument(id, docType, file, userId, req) {
  const fields = STAFF_DOC_FIELDS[docType];
  if (!fields) throw ApiError.badRequest('Invalid document type');

  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');
  if (!file) throw ApiError.badRequest('No file uploaded');

  user[fields.path] = `staff-docs/${file.filename}`;
  user[fields.name] = file.originalname;
  await user.save();

  await logAudit({
    action: 'update',
    module: 'users',
    entityType: 'User',
    entityId: user._id,
    description: `Uploaded ${docType} for staff ${user.staffId || user.email}`,
    userId,
    req,
  });

  return formatUser(user.toObject());
}

export default {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  setUserActive,
  uploadStaffDocument,
};
