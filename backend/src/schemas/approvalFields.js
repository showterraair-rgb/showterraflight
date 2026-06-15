import mongoose from 'mongoose';

export const approvalTimelineSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: '' },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

export const passportFields = {
  passportFilePath: { type: String, trim: true },
  passportFileName: { type: String, trim: true },
  passportMimeType: { type: String, trim: true },
  passportUploadedAt: { type: Date },
};
