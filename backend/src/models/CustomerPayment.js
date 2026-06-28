import mongoose from 'mongoose';
import { PAYMENT_STATUSES } from '../config/constants.js';

const customerPaymentSchema = new mongoose.Schema(
  {
    paymentNumber: { type: String, unique: true, required: true },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
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
    receiptFilePath: { type: String, trim: true, default: '' },
    receiptFileName: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'paid',
    },
    isVoided: { type: Boolean, default: false },
    isRefund: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const CustomerPayment = mongoose.model('CustomerPayment', customerPaymentSchema);

export default CustomerPayment;
