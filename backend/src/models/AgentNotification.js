import mongoose from 'mongoose';
import { AGENT_NOTIFICATION_TYPES } from '../config/agentConstants.js';

const agentNotificationSchema = new mongoose.Schema(
  {
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false, index: true },
    type: { type: String, enum: AGENT_NOTIFICATION_TYPES, default: 'general' },
    relatedBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'AgentBooking' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

agentNotificationSchema.index({ agent: 1, createdAt: -1 });

const AgentNotification = mongoose.model('AgentNotification', agentNotificationSchema);

export default AgentNotification;
