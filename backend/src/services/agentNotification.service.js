import AgentNotification from '../models/AgentNotification.js';
import ApiError from '../utils/ApiError.js';
import {
  parsePaginationQuery,
  buildPaginationResponse,
} from '../utils/pagination.js';
import { getAgentLedger } from './adminAgent.service.js';

export async function listAgentNotifications(agentId, query) {
  const { page, limit, skip, sort } = parsePaginationQuery(query, 'createdAt');
  const filter = { agent: agentId };
  if (query.unreadOnly === 'true') filter.isRead = false;

  const [items, total, unreadCount] = await Promise.all([
    AgentNotification.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    AgentNotification.countDocuments(filter),
    AgentNotification.countDocuments({ agent: agentId, isRead: false }),
  ]);

  return {
    items: items.map((n) => ({
      id: n._id.toString(),
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      type: n.type,
      relatedBookingId: n.relatedBooking?.toString() || null,
      createdAt: n.createdAt,
    })),
    unreadCount,
    pagination: buildPaginationResponse({ page, limit, total }),
  };
}

export async function markNotificationRead(agentId, notificationId) {
  const n = await AgentNotification.findOneAndUpdate(
    { _id: notificationId, agent: agentId },
    { isRead: true },
    { new: true }
  );
  if (!n) throw ApiError.notFound('Notification not found');
  return { id: n._id.toString(), isRead: true };
}

export async function markAllNotificationsRead(agentId) {
  await AgentNotification.updateMany({ agent: agentId, isRead: false }, { isRead: true });
  return { message: 'All notifications marked as read' };
}

export async function getAgentStatement(agentId, query) {
  return getAgentLedger(agentId, query);
}

export default {
  listAgentNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getAgentStatement,
};
