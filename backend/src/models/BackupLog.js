import mongoose from 'mongoose';

const backupLogSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number },
    status: {
      type: String,
      enum: ['success', 'failed', 'in_progress'],
      default: 'in_progress',
    },
    backupType: {
      type: String,
      enum: ['scheduled', 'manual'],
      default: 'scheduled',
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    errorMessage: { type: String },
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    restoreNotes: { type: String, default: 'Restore is manual-only. Contact admin to restore from backup file.' },
    restoreStatus: {
      type: String,
      enum: ['none', 'requested', 'completed'],
      default: 'none',
    },
    restoreRequestedAt: { type: Date },
    restoreRequestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    offsitePath: { type: String },
    checksum: { type: String },
  },
  { timestamps: true }
);

const BackupLog = mongoose.model('BackupLog', backupLogSchema);

export default BackupLog;
