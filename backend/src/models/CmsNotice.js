import mongoose from 'mongoose';

const cmsNoticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ['notice', 'offer', 'faq', 'announcement'],
      default: 'notice',
    },
    isPublished: { type: Boolean, default: true },
    isPinned: { type: Boolean, default: false },
    publishDate: { type: Date, default: Date.now },
    expireDate: { type: Date },
    sortOrder: { type: Number, default: 0 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

cmsNoticeSchema.index({ type: 1, isPublished: 1, publishDate: -1 });

const CmsNotice = mongoose.model('CmsNotice', cmsNoticeSchema);

export default CmsNotice;
