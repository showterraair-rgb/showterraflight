import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    type: {
      type: String,
      enum: ['agent', 'supplier', 'airline_office', 'other'],
      default: 'agent',
    },
    notes: { type: String, default: '' },
    paymentTerms: { type: String, trim: true, default: '' },
    totalPayable: { type: Number, default: 0, min: 0 },
    totalPaid: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

supplierSchema.index({ name: 'text', phone: 'text', company: 'text' });

const Supplier = mongoose.model('Supplier', supplierSchema);

export default Supplier;
