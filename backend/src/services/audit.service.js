import AuditLog from '../models/AuditLog.js';
import getClientIp from '../utils/getClientIp.js';

/**
 * Write an audit log entry for create/update/delete/status actions.
 */
export async function logAudit({
  action,
  module,
  entityType,
  entityId,
  description,
  changes,
  userId,
  req,
}) {
  await AuditLog.create({
    action,
    module,
    entityType,
    entityId,
    description,
    changes,
    user: userId,
    ipAddress: req ? getClientIp(req) : undefined,
    userAgent: req?.headers?.['user-agent'],
  });
}

export default logAudit;
