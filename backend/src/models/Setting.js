import mongoose from 'mongoose';
import { COMPANY_DEFAULTS } from '../config/constants.js';
import { DEFAULT_CURRENCIES } from '../config/currencies.js';

const currencyItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    symbol: { type: String, required: true },
    code: { type: String, required: true },
    isBase: { type: Boolean, default: false },
    rateToBase: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

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
    currencies: {
      BDT: { type: currencyItemSchema, default: () => ({ ...DEFAULT_CURRENCIES.BDT }) },
      BRL: { type: currencyItemSchema, default: () => ({ ...DEFAULT_CURRENCIES.BRL }) },
    },
    currenciesUpdatedAt: { type: Date },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Setting = mongoose.model('Setting', settingSchema);

export default Setting;
