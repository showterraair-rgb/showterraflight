import mongoose from 'mongoose';
import { BOOKING_OPERATION_STATUSES, BOOKING_OPERATION_TYPES } from '../config/constants.js';

const bookingOperationSchema = new mongoose.Schema(
  {
    operationNumber: { type: String, required: true, unique: true, trim: true, index: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    operationType: { type: String, enum: BOOKING_OPERATION_TYPES, required: true, index: true },
    operationDate: { type: Date, required: true, default: Date.now },
    oldTicketNumber: { type: String, trim: true, default: '' },
    newTicketNumber: { type: String, trim: true, default: '' },
    supplierAdjustmentBRL: { type: Number, default: 0 },
    saleAdjustmentBRL: { type: Number, default: 0 },
    penaltyBRL: { type: Number, default: 0, min: 0 },
    serviceChargeBRL: { type: Number, default: 0, min: 0 },
    refundAmountBRL: { type: Number, default: 0, min: 0 },
    receivedAdjustmentBRL: { type: Number, default: 0 },
    payableAdjustmentBRL: { type: Number, default: 0 },
    exchangeRateBrlToBdt: { type: Number, min: 0 },
    remarks: { type: String, default: '' },
    status: {
      type: String,
      enum: BOOKING_OPERATION_STATUSES,
      default: 'completed',
      index: true,
    },
    legacyChildBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    financialApplied: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

bookingOperationSchema.index({ booking: 1, operationDate: -1 });

const BookingOperation = mongoose.model('BookingOperation', bookingOperationSchema);

export default BookingOperation;
