import { Router } from 'express';
import authorize from '../middlewares/authorize.js';
import * as securityController from '../controllers/security.controller.js';

const router = Router();

router.get('/login-logs', authorize('audit:view'), securityController.loginLogs);
router.get('/logs', authorize('audit:view'), securityController.auditLogs);
router.get('/overview', authorize('audit:view'), securityController.overview);

export default router;
