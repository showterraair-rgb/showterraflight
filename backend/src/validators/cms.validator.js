import { z } from 'zod';
import { CMS_PAGE_KEYS } from '../config/constants.js';

export const updatePageSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  content: z.record(z.unknown()).optional(),
  sections: z.array(z.unknown()).optional(),
  isPublished: z.boolean().optional(),
  seo: z
    .object({
      metaTitle: z.string().max(160).optional(),
      metaDescription: z.string().max(320).optional(),
      metaKeywords: z.array(z.string()).optional(),
      ogImage: z.string().optional(),
    })
    .optional(),
});

export const createNoticeSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  type: z.enum(['notice', 'offer', 'faq', 'announcement', 'blog']).optional(),
  isPublished: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  publishDate: z.string().optional(),
  expireDate: z.string().optional(),
  sortOrder: z.number().optional(),
});

export const updateNoticeSchema = createNoticeSchema.partial();

export const updateCompanySchema = z.object({
  company: z
    .object({
      name: z.string().optional(),
      address: z.string().optional(),
      email: z.string().email().optional(),
      whatsapp: z.string().optional(),
      iataNumber: z.string().optional(),
      emergencyContact: z.string().optional(),
      directorName: z.string().optional(),
      directorPhone: z.string().optional(),
      ownerEmail: z.string().email().optional(),
      currency: z.string().optional(),
      timezone: z.string().optional(),
    })
    .optional(),
  socialLinks: z
    .object({
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      youtube: z.string().optional(),
      linkedin: z.string().optional(),
    })
    .optional(),
  paymentDetails: z
    .object({
      bankName: z.string().optional(),
      bankAccountName: z.string().optional(),
      bankAccountNumber: z.string().optional(),
      bankBranch: z.string().optional(),
      bkashNumber: z.string().optional(),
      nagadNumber: z.string().optional(),
      paymentNote: z.string().optional(),
    })
    .optional(),
  logo: z
    .object({
      filePath: z.string().optional(),
      fileName: z.string().optional(),
      altText: z.string().optional(),
    })
    .optional(),
});

export const updateLogoSchema = z.object({
  filePath: z.string().min(1),
  fileName: z.string().optional(),
  altText: z.string().optional(),
});

export const pageKeyParamSchema = z.object({
  pageKey: z.enum(CMS_PAGE_KEYS),
});

export default {
  updatePageSchema,
  createNoticeSchema,
  updateNoticeSchema,
  updateCompanySchema,
  updateLogoSchema,
  pageKeyParamSchema,
};
