import mongoose from 'mongoose';
import { PAYMENT_STATUSES } from '../config/constants.js';

const supplierPaymentSchema = new mongoose.Schema(
  {
    paymentNumber: { type: String, unique: true, required: true },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true,
    },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    amount: { type: Number, required: true, min: 0.01 },
    paymentDate: { type: Date, required: true, index: true },
    paymentMethod: { type: String, trim: true },
    referenceNumber: { type: String, trim: true },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'paid',
    },
    isVoided: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const SupplierPayment = mongoose.model('SupplierPayment', supplierPaymentSchema);

export default SupplierPayment;
