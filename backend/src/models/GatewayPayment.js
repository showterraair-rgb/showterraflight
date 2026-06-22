import mongoose from 'mongoose';

const GATEWAY_TYPES = ['sslcommerz', 'bkash'];
const GATEWAY_STATUSES = ['initiated', 'success', 'failed', 'cancelled'];

const gatewayPaymentSchema = new mongoose.Schema(
  {
    transactionId: { type: String, unique: true, required: true, index: true },
    gateway: { type: String, enum: GATEWAY_TYPES, required: true, index: true },
    status: { type: String, enum: GATEWAY_STATUSES, default: 'initiated', index: true },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: 'BDT' },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', index: true },
    paymentRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentRequest', index: true },
    sessionKey: { type: String, trim: true },
    gatewayUrl: { type: String, trim: true },
    valId: { type: String, trim: true },
    bankTransactionId: { type: String, trim: true },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed },
    customerPayment: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerPayment' },
    settlementAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date },
    failureReason: { type: String, default: '' },
  },
  { timestamps: true }
);

const GatewayPayment = mongoose.model('GatewayPayment', gatewayPaymentSchema);

export default GatewayPayment;
export { GATEWAY_TYPES, GATEWAY_STATUSES };
