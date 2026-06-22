import mongoose from 'mongoose';

const PAYMENT_REQUEST_STATUSES = ['pending', 'paid', 'cancelled'];

const paymentRequestSchema = new mongoose.Schema(
  {
    requestNumber: { type: String, unique: true, required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', index: true },
    amount: { type: Number, required: true, min: 0.01 },
    dueDate: { type: Date, required: true, index: true },
    status: { type: String, enum: PAYMENT_REQUEST_STATUSES, default: 'pending', index: true },
    notes: { type: String, default: '' },
    customerPayment: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerPayment' },
    sentAt: { type: Date },
    paidAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const PaymentRequest = mongoose.model('PaymentRequest', paymentRequestSchema);

export default PaymentRequest;
export { PAYMENT_REQUEST_STATUSES };
