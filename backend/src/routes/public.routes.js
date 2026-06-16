import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as publicController from '../controllers/public.controller.js';
import { bookingRequestSchema } from '../validators/public.validator.js';
import { publicPassportUploadSchema } from '../validators/approval.validator.js';
import validate from '../middlewares/validate.js';
import { passportUpload } from '../middlewares/upload.js';

const router = Router();

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many booking requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/settings/company', publicController.getCompanySettings);
router.get('/currencies', publicController.getPublicCurrencies);
router.get('/cms/pages/:pageKey', publicController.getCmsPage);
router.get('/cms/notices', publicController.getNotices);
router.post(
  '/booking-requests',
  bookingLimiter,
  validate(bookingRequestSchema),
  publicController.createBookingRequest
);

router.post(
  '/booking-requests/passport',
  bookingLimiter,
  passportUpload.single('passport'),
  validate(publicPassportUploadSchema),
  publicController.uploadPassport
);

export default router;
