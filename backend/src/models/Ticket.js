import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
    },
    pnr: { type: String, trim: true, index: true },
    ticketNumber: { type: String, trim: true },
    airline: { type: String, trim: true },
    passengerNames: [{ type: String, trim: true }],
    filePath: { type: String },
    fileName: { type: String },
    mimeType: { type: String },
    fileSize: { type: Number },
    issuedAt: { type: Date },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
