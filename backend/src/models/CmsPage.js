import mongoose from 'mongoose';
import { CMS_PAGE_KEYS } from '../config/constants.js';

const seoSchema = new mongoose.Schema(
  {
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    metaKeywords: [{ type: String, trim: true }],
    ogImage: { type: String },
  },
  { _id: false }
);

const cmsPageSchema = new mongoose.Schema(
  {
    pageKey: {
      type: String,
      enum: CMS_PAGE_KEYS,
      required: true,
      unique: true,
    },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    content: { type: mongoose.Schema.Types.Mixed, default: {} },
    sections: [{ type: mongoose.Schema.Types.Mixed }],
    isPublished: { type: Boolean, default: true },
    seo: seoSchema,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const CmsPage = mongoose.model('CmsPage', cmsPageSchema);

export default CmsPage;
