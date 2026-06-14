import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as publicController from '../controllers/public.controller.js';
import { bookingRequestSchema } from '../validators/public.validator.js';
import validate from '../middlewares/validate.js';

const router = Router();

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many booking requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/settings/company', publicController.getCompanySettings);
router.get('/cms/pages/:pageKey', publicController.getCmsPage);
router.get('/cms/notices', publicController.getNotices);
router.post(
  '/booking-requests',
  bookingLimiter,
  validate(bookingRequestSchema),
  publicController.createBookingRequest
);

export default router;
