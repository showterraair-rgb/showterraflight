import mongoose from 'mongoose';
import {
  AGENT_BOOKING_STATUSES,
  AGENT_BOOKING_TYPES,
  AGENT_TRAVEL_CLASSES,
  AGENT_PASSENGER_TITLES,
  AGENT_MEAL_PREFERENCES,
  AGENT_SEAT_PREFERENCES,
} from '../config/agentConstants.js';

const passengerSchema = new mongoose.Schema(
  {
    title: { type: String, enum: AGENT_PASSENGER_TITLES, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dob: { type: Date },
    passportNumber: { type: String, required: true, trim: true },
    passportExpiry: { type: Date },
    nationality: { type: String, trim: true },
  },
  { _id: false }
);

const statusTimelineSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: '' },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const agentBookingSchema = new mongoose.Schema(
  {
    bookingRef: { type: String, required: true, unique: true, trim: true },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true, index: true },
    flightNumber: { type: String, required: true, trim: true },
    airline: { type: String, required: true, trim: true },
    fromCity: { type: String, required: true, trim: true },
    toCity: { type: String, required: true, trim: true },
    departureDate: { type: Date, required: true },
    departureTime: { type: String, trim: true },
    arrivalDate: { type: Date },
    arrivalTime: { type: String, trim: true },
    travelClass: { type: String, enum: AGENT_TRAVEL_CLASSES, default: 'economy' },
    pnr: { type: String, trim: true },
    passengers: { type: [passengerSchema], validate: [(v) => v?.length >= 1, 'At least one passenger required'] },
    baseFare: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    agentMarkup: { type: Number, default: 0, min: 0 },
    totalFare: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'BDT', enum: ['BDT', 'BRL'], trim: true },
    originalCurrency: { type: String, enum: ['BDT', 'BRL'], default: 'BDT' },
    originalBaseFare: { type: Number, default: 0, min: 0 },
    originalTax: { type: Number, default: 0, min: 0 },
    originalMarkup: { type: Number, default: 0, min: 0 },
    originalTotalFare: { type: Number, default: 0, min: 0 },
    baseFareBDT: { type: Number, default: 0, min: 0 },
    taxBDT: { type: Number, default: 0, min: 0 },
    markupBDT: { type: Number, default: 0, min: 0 },
    totalFareBDT: { type: Number, default: 0, min: 0 },
    baseFareBRL: { type: Number, default: 0, min: 0 },
    taxBRL: { type: Number, default: 0, min: 0 },
    markupBRL: { type: Number, default: 0, min: 0 },
    totalFareBRL: { type: Number, default: 0, min: 0 },
    bdtRateAtBooking: { type: Number, default: 1, min: 0 },
    exchangeRateAtBooking: { type: Number, default: 1, min: 0 },
    bookingType: { type: String, enum: AGENT_BOOKING_TYPES, default: 'standard' },
    specialRequests: { type: String, maxlength: 2000 },
    baggageAllowance: { type: String, trim: true },
    mealPreference: { type: String, enum: AGENT_MEAL_PREFERENCES, default: 'None' },
    seatPreference: { type: String, enum: AGENT_SEAT_PREFERENCES, default: 'No Preference' },
    ticketIssued: { type: Boolean, default: false },
    ticketFilePath: { type: String, trim: true },
    ticketFileName: { type: String, trim: true },
    status: { type: String, enum: AGENT_BOOKING_STATUSES, default: 'pending', index: true },
    adminNotes: { type: String, maxlength: 2000 },
    statusTimeline: [statusTimelineSchema],
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    confirmedAt: { type: Date },
  },
  { timestamps: true }
);

agentBookingSchema.index({ agent: 1, createdAt: -1 });
agentBookingSchema.index({ pnr: 1 });
agentBookingSchema.index({ airline: 1 });

const AgentBooking = mongoose.model('AgentBooking', agentBookingSchema);

export default AgentBooking;
