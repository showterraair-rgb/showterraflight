import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import authorize from '../middlewares/authorize.js';

const router = Router();

router.use(authorize('dashboard:view'));

router.get('/summary', dashboardController.getSummary);
router.get('/recent-activity', dashboardController.getRecentActivity);
router.get('/alerts', dashboardController.getAlerts);

export default router;
