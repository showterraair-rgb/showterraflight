import { Router } from 'express';
import * as agentController from '../../controllers/agent.controller.js';
import validate from '../../middlewares/validate.js';
import loginRateLimit from '../../middlewares/loginRateLimit.js';
import {
  agentLoginSchema,
  agentForgotPasswordSchema,
  agentResetPasswordSchema,
} from '../../validators/agent.validator.js';

const router = Router();

router.post('/login', loginRateLimit, validate(agentLoginSchema), agentController.login);
router.post('/forgot-password', loginRateLimit, validate(agentForgotPasswordSchema), agentController.forgotPassword);
router.post('/reset-password', validate(agentResetPasswordSchema), agentController.resetPassword);
router.post('/logout', agentController.logout);

export default router;
