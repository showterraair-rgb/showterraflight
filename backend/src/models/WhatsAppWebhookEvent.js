import mongoose from 'mongoose';

const whatsAppWebhookEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      enum: ['verification', 'message', 'status', 'unknown'],
      default: 'unknown',
    },
    providerMessageId: { type: String, default: '', trim: true, index: true },
    recipient: { type: String, default: '', trim: true },
    status: { type: String, default: '', trim: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    notificationLog: { type: mongoose.Schema.Types.ObjectId, ref: 'NotificationLog' },
    processed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

whatsAppWebhookEventSchema.index({ createdAt: -1 });

const WhatsAppWebhookEvent = mongoose.model('WhatsAppWebhookEvent', whatsAppWebhookEventSchema);

export default WhatsAppWebhookEvent;
