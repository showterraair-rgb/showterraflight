import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.SALES_EXECUTIVE,
    },
    roleRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    department: { type: String, trim: true, default: '' },
    designation: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '', maxlength: 2000 },
    permissionOverrides: {
      grants: { type: [String], default: [] },
      denies: { type: [String], default: [] },
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    lastActivityAt: { type: Date },
    passwordChangedAt: { type: Date },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, select: false },
    mfaPending: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, isActive: 1 });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = new Date();
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
