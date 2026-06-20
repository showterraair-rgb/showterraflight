import mongoose from 'mongoose';

const whatsAppSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'whatsapp' },
    accessToken: { type: String, default: '', trim: true },
    phoneNumberId: { type: String, default: '', trim: true },
    businessAccountId: { type: String, default: '', trim: true },
    webhookVerifyToken: { type: String, default: '', trim: true },
    apiVersion: { type: String, default: 'v21.0', trim: true },
    defaultCountryCode: { type: String, default: '880', trim: true },
    defaultLanguageCode: { type: String, default: 'en', trim: true },
    testTemplateName: { type: String, default: 'hello_world', trim: true },
    isEnabled: { type: Boolean, default: false },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const WhatsAppSetting = mongoose.model('WhatsAppSetting', whatsAppSettingSchema);

export default WhatsAppSetting;
