import mongoose from 'mongoose';

const securitySettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'security' },
    minPasswordLength: { type: Number, default: 10 },
    requireUppercase: { type: Boolean, default: true },
    requireLowercase: { type: Boolean, default: true },
    requireNumber: { type: Boolean, default: true },
    requireSpecialChar: { type: Boolean, default: false },
    sessionTimeoutMinutes: { type: Number, default: 30 },
    maxLoginAttempts: { type: Number, default: 5 },
    lockoutMinutes: { type: Number, default: 15 },
    mfaRequiredForAdmin: { type: Boolean, default: false },
    auditRetentionDays: { type: Number, default: 365 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const SecuritySetting = mongoose.model('SecuritySetting', securitySettingsSchema);

export default SecuritySetting;
