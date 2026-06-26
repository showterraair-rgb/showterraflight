import mongoose from 'mongoose';

const otpCodeSchema = new mongoose.Schema(
  {
    identifier: { type: String, required: true, trim: true, index: true },
    channel: { type: String, enum: ['email', 'phone'], required: true },
    codeHash: { type: String, required: true, select: false },
    purpose: { type: String, default: 'staff_login', index: true },
    expiresAt: { type: Date, required: true, index: true },
    verified: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

otpCodeSchema.index({ identifier: 1, purpose: 1, createdAt: -1 });

const OtpCode = mongoose.model('OtpCode', otpCodeSchema);

export default OtpCode;
