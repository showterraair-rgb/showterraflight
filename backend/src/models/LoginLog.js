import mongoose from 'mongoose';

const loginLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    email: { type: String, trim: true, lowercase: true },
    success: { type: Boolean, required: true },
    failureReason: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

loginLogSchema.index({ createdAt: -1 });

const LoginLog = mongoose.model('LoginLog', loginLogSchema);

export default LoginLog;
