import mongoose from 'mongoose';
import { BOOKING_STATUSES, PAYMENT_STATUSES } from '../config/constants.js';

const statusTimelineSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: '' },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const activityNoteSchema = new mongoose.Schema(
  {
    note: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, unique: true, required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    airline: { type: String, required: true, trim: true },
    route: { type: String, required: true, trim: true },
    sector: { type: String, trim: true },
    departureDate: { type: Date, required: true },
    returnDate: { type: Date },
    passengerCount: { type: Number, min: 1, default: 1 },
    pnr: { type: String, trim: true, index: true },
    ticketNumber: { type: String, trim: true },
    purchasePrice: { type: Number, required: true, min: 0, default: 0 },
    salePrice: { type: Number, required: true, min: 0, default: 0 },
    directCosts: { type: Number, default: 0, min: 0 },
    profit: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    customerDue: { type: Number, default: 0, min: 0 },
    supplierPayable: { type: Number, default: 0, min: 0 },
    supplierPaid: { type: Number, default: 0, min: 0 },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'unpaid',
    },
    supplierPaymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'unpaid',
    },
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: 'draft',
      index: true,
    },
    statusTimeline: [statusTimelineSchema],
    activityNotes: [activityNoteSchema],
    notes: { type: String, default: '' },
    ticketCopyPath: { type: String },
    ticketCopyFileName: { type: String },
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deliveredAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

bookingSchema.pre('save', function calculateProfit(next) {
  this.profit = (this.salePrice || 0) - (this.purchasePrice || 0) - (this.directCosts || 0);
  this.customerDue = Math.max(0, (this.salePrice || 0) - (this.amountPaid || 0));
  this.supplierPayable = Math.max(0, (this.purchasePrice || 0) + (this.directCosts || 0) - (this.supplierPaid || 0));
  next();
});

bookingSchema.index({ departureDate: 1 });
bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ supplier: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
