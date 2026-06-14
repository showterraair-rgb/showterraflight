import mongoose from 'mongoose';
import { ACCOUNT_TYPES, MOBILE_BANKING_TYPES } from '../config/constants.js';

const accountSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    name: { type: String, required: true, trim: true },
    accountName: { type: String, trim: true, default: '' },
    type: {
      type: String,
      enum: ACCOUNT_TYPES,
      required: true,
    },
    accountNumber: { type: String, trim: true, default: '' },
    bankName: { type: String, trim: true, default: '' },
    branchRouting: { type: String, trim: true, default: '' },
    mobileNumber: { type: String, trim: true, default: '' },
    mobileBankingType: {
      type: String,
      enum: [...MOBILE_BANKING_TYPES, null],
      default: null,
    },
    qrImagePath: { type: String, trim: true, default: '' },
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    notes: { type: String, default: '' },
    lastClosingDate: { type: Date },
    lastClosingBalance: { type: Number },
  },
  { timestamps: true }
);

accountSchema.index({ type: 1, isActive: 1 });

const Account = mongoose.model('Account', accountSchema);

export default Account;
