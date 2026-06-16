import mongoose from 'mongoose';
import {
  ORDER_SOURCES,
  ORDER_STATUSES,
  JOURNEY_TYPES,
  TRAVEL_CLASSES,
  APPROVAL_STATUSES,
} from '../config/constants.js';
import { approvalTimelineSchema, passportFields } from '../schemas/approvalFields.js';

const followUpNoteSchema = new mongoose.Schema(
  {
    note: { type: String, required: true },
    nextFollowUpDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    customerEmail: { type: String, trim: true, lowercase: true },
    source: {
      type: String,
      enum: ORDER_SOURCES,
      default: 'phone',
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'inquiry',
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: APPROVAL_STATUSES,
      default: 'pending',
      index: true,
    },
    approvalTimeline: [approvalTimelineSchema],
    ...passportFields,
    journeyType: {
      type: String,
      enum: JOURNEY_TYPES,
      default: 'one_way',
    },
    fromDestination: { type: String, required: true, trim: true },
    toDestination: { type: String, required: true, trim: true },
    journeyDate: { type: Date, required: true },
    returnDate: { type: Date },
    passengerCount: { type: Number, required: true, min: 1, default: 1 },
    travelClass: {
      type: String,
      enum: TRAVEL_CLASSES,
      default: 'economy',
    },
    quotedSalePrice: { type: Number, min: 0 },
    preferredCurrency: { type: String, enum: ['BDT', 'BRL'], default: 'BDT' },
    requestNotes: { type: String, default: '' },
    internalNotes: { type: String, default: '' },
    followUpNotes: [followUpNoteSchema],
    nextFollowUpDate: { type: Date, index: true },
    websiteBookingId: { type: String },
    isFromWebsite: { type: Boolean, default: false },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    closedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ customerPhone: 1 });
orderSchema.index({ status: 1, nextFollowUpDate: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
