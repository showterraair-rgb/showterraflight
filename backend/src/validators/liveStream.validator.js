import { z } from 'zod';

const platformEnum = z.enum(['youtube', 'facebook', 'custom']);
const statusEnum = z.enum(['draft', 'scheduled', 'live', 'ended']);

const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .or(z.literal(''))
  .refine((v) => !v || /^https?:\/\//i.test(v) || /\.m3u8(\?|$)/i.test(v), {
    message: 'Must be a valid http(s) URL',
  });

export const createLiveStreamSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().or(z.literal('')),
  platform: platformEnum.optional(),
  streamUrl: optionalUrl,
  embedUrl: optionalUrl,
  thumbnailUrl: optionalUrl,
  status: statusEnum.optional(),
  scheduledAt: z
    .union([z.string().min(1), z.literal(''), z.null()])
    .optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  showOnHomepage: z.boolean().optional(),
  chatEnabled: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateLiveStreamSchema = createLiveStreamSchema.partial();

export const liveStreamListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: statusEnum.optional().or(z.literal('')),
  platform: platformEnum.optional().or(z.literal('')),
  search: z.string().optional(),
  isPublished: z.enum(['true', 'false']).optional(),
});

export default {
  createLiveStreamSchema,
  updateLiveStreamSchema,
  liveStreamListQuerySchema,
};
