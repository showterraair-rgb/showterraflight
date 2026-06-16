/**
 * Central API route registry for Show Terra Air.
 * Mount point: /api/v1
 */

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import publicRoutes from './public.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import orderRoutes from './order.routes.js';
import bookingRoutes from './booking.routes.js';
import customerRoutes from './customer.routes.js';
import supplierRoutes from './supplier.routes.js';
import accountRoutes from './account.routes.js';
import paymentRoutes from './payment.routes.js';
import expenseRoutes from './expense.routes.js';
import reminderRoutes from './reminder.routes.js';
import reportRoutes from './report.routes.js';
import cmsRoutes from './cms.routes.js';
import userRoutes from './user.routes.js';
import backupRoutes from './backup.routes.js';
import auditRoutes from './audit.routes.js';
import securityRoutes from './security.routes.js';
import notificationRoutes from './notification.routes.js';
import agentAuthRoutes from './agent/auth.routes.js';
import agentRoutes from './agent/index.js';
import adminAgentRoutes from './adminAgent.routes.js';
import settingsRoutes from './settings.routes.js';
import authenticate from '../middlewares/authenticate.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    service: 'Show Terra Air API',
    version: '1.0.0',
    phase: 6,
  });
});

// Public (no auth)
router.use('/public', publicRoutes);

// Auth (mixed — login public, me/logout protected)
router.use('/auth', authRoutes);

// Agent portal auth (public login) + protected agent API
router.use('/agent/auth', agentAuthRoutes);
router.use('/agent', agentRoutes);

// Protected admin routes
router.use(authenticate);

router.use('/dashboard', dashboardRoutes);
router.use('/orders', orderRoutes);
router.use('/bookings', bookingRoutes);
router.use('/customers', customerRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/accounts', accountRoutes);
router.use('/payments', paymentRoutes);
router.use('/expenses', expenseRoutes);
router.use('/reminders', reminderRoutes);
router.use('/reports', reportRoutes);
router.use('/cms', cmsRoutes);
router.use('/users', userRoutes);
router.use('/backups', backupRoutes);
router.use('/audit', auditRoutes);
router.use('/security', securityRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin/settings', settingsRoutes);
router.use('/admin', adminAgentRoutes);

export default router;
