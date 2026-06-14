import mongoose from 'mongoose';

const emailSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'email' },
    smtpHost: { type: String, default: '', trim: true },
    smtpPort: { type: Number, default: 587 },
    username: { type: String, default: '', trim: true },
    password: { type: String, default: '', trim: true },
    encryption: { type: String, enum: ['none', 'tls', 'ssl'], default: 'tls' },
    fromEmail: { type: String, default: '', trim: true },
    fromName: { type: String, default: '', trim: true },
    replyTo: { type: String, default: '', trim: true },
    isEnabled: { type: Boolean, default: false },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const EmailSetting = mongoose.model('EmailSetting', emailSettingSchema);

export default EmailSetting;
