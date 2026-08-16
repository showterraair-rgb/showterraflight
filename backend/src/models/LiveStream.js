import mongoose from 'mongoose';

const liveStreamSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000, default: '' },
    platform: {
      type: String,
      enum: ['youtube', 'facebook', 'custom'],
      default: 'youtube',
    },
    /** Watch / share URL (YouTube, Facebook, or HLS/m3u8) */
    streamUrl: { type: String, trim: true, default: '' },
    /** iframe-ready embed URL (auto-derived when possible) */
    embedUrl: { type: String, trim: true, default: '' },
    thumbnailUrl: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'live', 'ended'],
      default: 'draft',
      index: true,
    },
    scheduledAt: { type: Date },
    startedAt: { type: Date },
    endedAt: { type: Date },
    isPublished: { type: Boolean, default: false, index: true },
    /** Primary stream shown on /live when live or next up */
    isFeatured: { type: Boolean, default: false, index: true },
    showOnHomepage: { type: Boolean, default: false },
    chatEnabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

liveStreamSchema.index({ status: 1, isPublished: 1, scheduledAt: -1 });
liveStreamSchema.index({ isFeatured: 1, status: 1 });

const LiveStream = mongoose.model('LiveStream', liveStreamSchema);

export default LiveStream;
