import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    expenseNumber: { type: String, unique: true, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpenseCategory',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    expenseDate: { type: Date, required: true, index: true },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    paymentMethod: { type: String, trim: true },
    referenceNumber: { type: String, trim: true },
    notes: { type: String, default: '' },
    billFilePath: { type: String },
    billFileName: { type: String },
    isRecurring: { type: Boolean, default: false },
    recurringTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense' },
    recurringFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
    },
    nextDueDate: { type: Date },
    isVoided: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

expenseSchema.index({ expenseDate: -1, category: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
