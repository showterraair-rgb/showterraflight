import mongoose from 'mongoose';
import { BOOKING_STATUSES, BOOKING_TYPES, PRODUCT_CATEGORIES, PAYMENT_STATUSES, JOURNEY_TYPES, TRAVEL_CLASSES, APPROVAL_STATUSES } from '../config/constants.js';
import { approvalTimelineSchema, passportFields } from '../schemas/approvalFields.js';

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

const bookingPassengerSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'MR', trim: true },
    fullName: { type: String, required: true, trim: true },
    passengerType: { type: String, enum: ['ADULT', 'CHILD', 'INFANT'], default: 'ADULT' },
    eTicketNumber: { type: String, trim: true },
    checkInBaggage: { type: String, default: '20kg', trim: true },
    cabinBaggage: { type: String, default: '7Kg', trim: true },
  },
  { _id: false }
);

const flightSegmentSchema = new mongoose.Schema(
  {
    airlinePnr: { type: String, trim: true },
    flightNumber: { type: String, trim: true },
    aircraft: { type: String, trim: true },
    departureTime: { type: String, trim: true },
    arrivalTime: { type: String, trim: true },
    fromAirportName: { type: String, trim: true },
    toAirportName: { type: String, trim: true },
    duration: { type: String, trim: true },
    distance: { type: String, trim: true },
    stops: { type: String, default: 'Non Stop', trim: true },
  },
  { _id: false }
);

const fareBreakdownSchema = new mongoose.Schema(
  {
    baseFare: { type: Number, min: 0 },
    taxes: { type: Number, min: 0 },
    aitVat: { type: Number, default: 0, min: 0 },
    extraBaggage: { type: Number, default: 0, min: 0 },
    bundleCost: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, min: 0 },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, unique: true, required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    journeyType: {
      type: String,
      enum: JOURNEY_TYPES,
      default: 'one_way',
    },
    fromDestination: { type: String, trim: true, default: '' },
    toDestination: { type: String, trim: true, default: '' },
    travelClass: {
      type: String,
      enum: TRAVEL_CLASSES,
      default: 'economy',
    },
    approvalStatus: {
      type: String,
      enum: APPROVAL_STATUSES,
      default: 'pending',
      index: true,
    },
    approvalTimeline: [approvalTimelineSchema],
    ...passportFields,
    airline: { type: String, required: true, trim: true },
    route: { type: String, required: true, trim: true },
    sector: { type: String, trim: true },
    departureDate: { type: Date, required: true },
    returnDate: { type: Date },
    passengerCount: { type: Number, min: 1, default: 1 },
    passengers: [bookingPassengerSchema],
    flightSegment: flightSegmentSchema,
    fareBreakdown: fareBreakdownSchema,
    pnr: { type: String, trim: true, index: true },
    ticketNumber: { type: String, trim: true },
    purchasePrice: { type: Number, required: true, min: 0, default: 0 },
    salePrice: { type: Number, required: true, min: 0, default: 0 },
    directCosts: { type: Number, default: 0, min: 0 },
    profit: { type: Number, default: 0 },
    originalCurrency: { type: String, enum: ['BDT', 'BRL'], default: 'BDT' },
    originalSalePrice: { type: Number, default: 0, min: 0 },
    originalPurchasePrice: { type: Number, default: 0, min: 0 },
    originalDirectCosts: { type: Number, default: 0, min: 0 },
    salePriceBDT: { type: Number, default: 0, min: 0 },
    purchasePriceBDT: { type: Number, default: 0, min: 0 },
    directCostsBDT: { type: Number, default: 0, min: 0 },
    purchasePriceBRL: { type: Number, default: 0, min: 0 },
    salePriceBRL: { type: Number, default: 0, min: 0 },
    directCostsBRL: { type: Number, default: 0, min: 0 },
    bdtRateAtBooking: { type: Number, default: 1, min: 0 },
    exchangeRateAtBooking: { type: Number, default: 1, min: 0 },
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
    bookingType: {
      type: String,
      enum: BOOKING_TYPES,
      default: 'standard',
      index: true,
    },
    productCategory: {
      type: String,
      enum: PRODUCT_CATEGORIES,
      default: 'air',
      index: true,
    },
    parentBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    rrvNote: { type: String, default: '' },
    rrvPenalty: { type: Number, default: 0, min: 0 },
    rrvRefundAmount: { type: Number, default: 0, min: 0 },
    rrvProcessedAt: { type: Date },
    rrvProcessedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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
