import mongoose from 'mongoose';
import { COMPANY_DEFAULTS } from '../config/constants.js';

const socialLinksSchema = new mongoose.Schema(
  {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    youtube: { type: String, default: '' },
    linkedin: { type: String, default: '' },
  },
  { _id: false }
);

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'company' },
    company: {
      name: { type: String, default: COMPANY_DEFAULTS.name },
      address: { type: String, default: COMPANY_DEFAULTS.address },
      email: { type: String, default: COMPANY_DEFAULTS.email },
      whatsapp: { type: String, default: COMPANY_DEFAULTS.whatsapp },
      directorName: { type: String, default: COMPANY_DEFAULTS.directorName },
      directorPhone: { type: String, default: COMPANY_DEFAULTS.directorPhone },
      ownerEmail: { type: String, default: COMPANY_DEFAULTS.ownerEmail },
      currency: { type: String, default: COMPANY_DEFAULTS.currency },
      timezone: { type: String, default: COMPANY_DEFAULTS.timezone },
    },
    logo: {
      filePath: { type: String },
      fileName: { type: String },
      altText: { type: String, default: 'Show Terra Air' },
    },
    socialLinks: socialLinksSchema,
    orderNumberPrefix: { type: String, default: 'ORD' },
    bookingNumberPrefix: { type: String, default: 'BKG' },
    invoicePrefix: { type: String, default: 'INV' },
    paymentDetails: {
      bankName: { type: String, default: '' },
      bankAccountName: { type: String, default: '' },
      bankAccountNumber: { type: String, default: '' },
      bankBranch: { type: String, default: '' },
      bkashNumber: { type: String, default: '' },
      nagadNumber: { type: String, default: '' },
      paymentNote: { type: String, default: '' },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Setting = mongoose.model('Setting', settingSchema);

export default Setting;
