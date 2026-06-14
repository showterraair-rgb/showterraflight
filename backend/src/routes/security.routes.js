import { Router } from 'express';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import * as securityController from '../controllers/security.controller.js';
import { updateSecuritySettingsSchema } from '../validators/security.validator.js';

const router = Router();

router.get('/login-logs', authorize('audit:view'), securityController.loginLogs);
router.get('/logs', authorize('audit:view'), securityController.auditLogs);
router.get('/overview', authorize('audit:view'), securityController.overview);

router.get('/settings', authorize('settings:manage'), securityController.getSettings);
router.put(
  '/settings',
  authorize('settings:manage'),
  validate(updateSecuritySettingsSchema),
  securityController.updateSettings
);
router.post('/mfa/prepare', authorize('settings:manage'), securityController.prepareMfa);

export default router;
