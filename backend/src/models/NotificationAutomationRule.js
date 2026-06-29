import mongoose from 'mongoose';
import { NOTIFICATION_EVENT_TYPES } from '../config/constants.js';

const notificationAutomationRuleSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      enum: NOTIFICATION_EVENT_TYPES,
      required: true,
      unique: true,
    },
    notifyCustomer: { type: Boolean, default: false },
    notifyAdmin: { type: Boolean, default: false },
    notifySupplier: { type: Boolean, default: false },
    notifyAgent: { type: Boolean, default: false },
    smsEnabled: { type: Boolean, default: true },
    emailEnabled: { type: Boolean, default: true },
    whatsappEnabled: { type: Boolean, default: false },
    isEnabled: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const NotificationAutomationRule = mongoose.model(
  'NotificationAutomationRule',
  notificationAutomationRuleSchema
);

export default NotificationAutomationRule;
