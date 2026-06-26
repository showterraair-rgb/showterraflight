import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { loginSchema, changePasswordSchema, requestOtpSchema, verifyOtpSchema } from '../validators/auth.validator.js';
import validate from '../middlewares/validate.js';
import authenticate from '../middlewares/authenticate.js';
import loginRateLimit from '../middlewares/loginRateLimit.js';

const router = Router();

router.post('/login', loginRateLimit, validate(loginSchema), authController.login);
router.post('/otp/request', loginRateLimit, validate(requestOtpSchema), authController.requestOtp);
router.post('/otp/verify', loginRateLimit, validate(verifyOtpSchema), authController.verifyOtp);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.put(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

export default router;
