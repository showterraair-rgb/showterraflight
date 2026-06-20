import mongoose from 'mongoose';
import { NOTIFICATION_EVENT_TYPES, NOTIFICATION_LOG_STATUSES } from '../config/constants.js';

const notificationLogSchema = new mongoose.Schema(
  {
    eventType: { type: String, enum: NOTIFICATION_EVENT_TYPES, required: true },
    templateKey: { type: String, trim: true, default: '' },
    channel: { type: String, enum: ['sms', 'email', 'whatsapp', 'console'], required: true },
    recipient: { type: String, required: true, trim: true },
    subject: { type: String, default: '', trim: true },
    body: { type: String, default: '' },
    status: { type: String, enum: NOTIFICATION_LOG_STATUSES, default: 'pending' },
    errorMessage: { type: String, default: '' },
    providerMessageId: { type: String, default: '' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerPayment: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerPayment' },
    sentAt: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationLogSchema.index({ status: 1, createdAt: -1 });
notificationLogSchema.index({ booking: 1, createdAt: -1 });
notificationLogSchema.index({ order: 1, createdAt: -1 });

const NotificationLog = mongoose.model('NotificationLog', notificationLogSchema);

export default NotificationLog;
