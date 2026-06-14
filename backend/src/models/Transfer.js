import mongoose from 'mongoose';

const transferSchema = new mongoose.Schema(
  {
    transferNumber: { type: String, unique: true, required: true },
    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    amount: { type: Number, required: true, min: 0.01 },
    transferDate: { type: Date, required: true, index: true },
    referenceNumber: { type: String, trim: true },
    notes: { type: String, default: '' },
    isVoided: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const Transfer = mongoose.model('Transfer', transferSchema);

export default Transfer;
