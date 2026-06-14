import mongoose from 'mongoose';
import { TRANSACTION_TYPES } from '../config/constants.js';

const accountTransactionSchema = new mongoose.Schema(
  {
    transactionNumber: { type: String, unique: true, required: true },
    type: {
      type: String,
      enum: TRANSACTION_TYPES,
      required: true,
      index: true,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      index: true,
    },
    relatedAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    transactionDate: { type: Date, required: true, index: true },
    paymentMethod: { type: String, trim: true },
    referenceNumber: { type: String, trim: true },
    notes: { type: String, default: '' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    expense: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense' },
    transfer: { type: mongoose.Schema.Types.ObjectId, ref: 'Transfer' },
    customerPayment: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerPayment' },
    supplierPayment: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierPayment' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

accountTransactionSchema.index({ account: 1, transactionDate: -1 });

const AccountTransaction = mongoose.model('AccountTransaction', accountTransactionSchema);

export default AccountTransaction;
