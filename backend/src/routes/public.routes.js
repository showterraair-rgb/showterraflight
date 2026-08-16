import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as publicController from '../controllers/public.controller.js';
import * as liveStreamController from '../controllers/liveStream.controller.js';
import { bookingRequestSchema } from '../validators/public.validator.js';
import { publicPassportUploadSchema } from '../validators/approval.validator.js';
import validate from '../middlewares/validate.js';
import { passportUpload } from '../middlewares/upload.js';
import * as gatewayController from '../controllers/gateway.controller.js';

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
router.get('/livestreams', liveStreamController.publicFeed);
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

router.post('/payments/gateway/sslcommerz/ipn', gatewayController.sslcommerzIpn);
router.get('/payments/gateway/sslcommerz/success', gatewayController.sslcommerzSuccess);
router.get('/payments/gateway/sslcommerz/fail', gatewayController.sslcommerzFail);
router.get('/payments/gateway/sslcommerz/cancel', gatewayController.sslcommerzCancel);
router.get('/payments/gateway/bkash/callback', gatewayController.bkashCallback);
router.post('/payments/gateway/bkash/callback', gatewayController.bkashCallback);

export default router;
