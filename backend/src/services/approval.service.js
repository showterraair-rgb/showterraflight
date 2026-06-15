import {
  APPROVAL_STATUSES,
  APPROVAL_STATUS_SMS_EVENTS,
  APPROVAL_STATUS_LABELS,
} from '../config/constants.js';
import { triggerNotificationEventSafe } from './notificationOrchestrator.service.js';
import { buildOrderNotificationContext, buildBookingNotificationContext } from '../utils/notificationContext.js';
import ApiError from '../utils/ApiError.js';

function pushApprovalTimeline(doc, status, note, userId) {
  if (!doc.approvalTimeline) doc.approvalTimeline = [];
  doc.approvalTimeline.push({
    status,
    note: note || '',
    changedBy: userId,
    changedAt: new Date(),
  });
}

export function fireApprovalSms(doc, type, extra = {}) {
  const status = doc.approvalStatus || 'pending';
  const eventType = APPROVAL_STATUS_SMS_EVENTS[status];
  if (!eventType) return;

  const referenceNumber = doc.orderNumber || doc.bookingNumber || '';
  const base = type === 'order'
    ? buildOrderNotificationContext(doc, extra)
    : buildBookingNotificationContext(doc, extra.customer || null, extra);

  triggerNotificationEventSafe(eventType, {
    ...base,
    vars: {
      ...base.vars,
      referenceNumber,
      approvalStatus: APPROVAL_STATUS_LABELS[status] || status,
    },
  });
}

export function validateApprovalStatus(status) {
  if (!APPROVAL_STATUSES.includes(status)) {
    throw ApiError.badRequest(`Invalid approval status. Use: ${APPROVAL_STATUSES.join(', ')}`);
  }
}

export function applyApprovalUpdate(doc, { approvalStatus, note }, userId) {
  validateApprovalStatus(approvalStatus);
  if (doc.approvalStatus === approvalStatus) {
    return false;
  }
  doc.approvalStatus = approvalStatus;
  pushApprovalTimeline(doc, approvalStatus, note, userId);
  return true;
}

export function applyPassportFile(doc, fileMeta) {
  doc.passportFilePath = fileMeta.path;
  doc.passportFileName = fileMeta.fileName;
  doc.passportMimeType = fileMeta.mimeType;
  doc.passportUploadedAt = new Date();
}

export default {
  fireApprovalSms,
  validateApprovalStatus,
  applyApprovalUpdate,
  applyPassportFile,
  pushApprovalTimeline,
};
