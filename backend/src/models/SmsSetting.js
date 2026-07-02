import mongoose from 'mongoose';

const smsSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'sms' },
    providerName: { type: String, default: '', trim: true },
    apiUrl: { type: String, default: '', trim: true },
    balanceUrl: { type: String, default: 'http://bulksmsbd.net/api/getBalanceApi', trim: true },
    apiKey: { type: String, default: '', trim: true },
    apiToken: { type: String, default: '', trim: true },
    senderId: { type: String, default: '', trim: true },
    isMasking: { type: Boolean, default: false },
    username: { type: String, default: '', trim: true },
    password: { type: String, default: '', trim: true },
    isEnabled: { type: Boolean, default: false },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const SmsSetting = mongoose.model('SmsSetting', smsSettingSchema);

export default SmsSetting;
