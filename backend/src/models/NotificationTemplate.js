import mongoose from 'mongoose';
import { NOTIFICATION_EVENT_TYPES } from '../config/constants.js';

const notificationTemplateSchema = new mongoose.Schema(
  {
    templateKey: {
      type: String,
      enum: NOTIFICATION_EVENT_TYPES,
      required: true,
      unique: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    smsBody: { type: String, default: '' },
    emailSubject: { type: String, default: '' },
    emailBody: { type: String, default: '' },
    whatsappTemplateName: { type: String, default: '', trim: true },
    whatsappTemplateLanguage: { type: String, default: 'en', trim: true },
    whatsappParamKeys: { type: String, default: '', trim: true },
    whatsappBody: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const NotificationTemplate = mongoose.model('NotificationTemplate', notificationTemplateSchema);

export default NotificationTemplate;
