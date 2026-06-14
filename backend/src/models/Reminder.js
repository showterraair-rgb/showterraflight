import mongoose from 'mongoose';
import { REMINDER_TYPES, REMINDER_STATUSES } from '../config/constants.js';

const reminderSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: REMINDER_TYPES,
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, default: '' },
    dueDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: REMINDER_STATUSES,
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    expense: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date },
    failedAt: { type: Date },
    failureReason: { type: String },
    deliveryChannel: { type: String, enum: ['console', 'email', 'sms', 'whatsapp'], default: 'console' },
    attemptCount: { type: Number, default: 0 },
    completedAt: { type: Date },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

reminderSchema.index({ status: 1, dueDate: 1 });

const Reminder = mongoose.model('Reminder', reminderSchema);

export default Reminder;
