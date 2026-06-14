import mongoose from 'mongoose';
import { ACCOUNT_TYPES } from '../config/constants.js';

const accountSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ACCOUNT_TYPES,
      required: true,
      unique: true,
    },
    accountNumber: { type: String, trim: true },
    bankName: { type: String, trim: true },
    mobileNumber: { type: String, trim: true },
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    notes: { type: String, default: '' },
    lastClosingDate: { type: Date },
    lastClosingBalance: { type: Number },
  },
  { timestamps: true }
);

const Account = mongoose.model('Account', accountSchema);

export default Account;
