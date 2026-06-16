import { Router } from 'express';
import * as agentController from '../../controllers/agent.controller.js';
import authAgent from '../../middlewares/authAgent.js';
import validate from '../../middlewares/validate.js';
import { agentTicketUpload } from '../../middlewares/upload.js';
import parseAgentBookingBody from '../../middlewares/parseAgentBookingBody.js';
import {
  updateAgentProfileSchema,
  changeAgentPasswordSchema,
  createAgentBookingSchema,
  listAgentBookingsQuerySchema,
  reportQuerySchema,
  idParamSchema,
} from '../../validators/agent.validator.js';

const router = Router();

router.use(authAgent);

router.get('/me', agentController.me);
router.get('/dashboard', agentController.dashboard);

router.get('/profile', agentController.getProfile);
router.patch('/profile', validate(updateAgentProfileSchema), agentController.updateProfile);
router.patch('/profile/password', validate(changeAgentPasswordSchema), agentController.changePassword);

router.post('/bookings', agentTicketUpload.single('ticketFile'), parseAgentBookingBody, validate(createAgentBookingSchema), agentController.createBooking);
router.get('/bookings', validate(listAgentBookingsQuerySchema, 'query'), agentController.listBookings);
router.get('/bookings/:id', validate(idParamSchema, 'params'), agentController.getBooking);
router.patch('/bookings/:id/cancel', validate(idParamSchema, 'params'), agentController.cancelBooking);

router.get('/reports/summary', validate(reportQuerySchema, 'query'), agentController.reportSummary);
router.get('/reports/monthly', validate(reportQuerySchema, 'query'), agentController.reportMonthly);
router.get('/reports/airlines', validate(reportQuerySchema, 'query'), agentController.reportAirlines);

router.get('/statement', validate(reportQuerySchema, 'query'), agentController.statement);

router.get('/notifications', agentController.listNotifications);
router.patch('/notifications/read-all', agentController.markAllNotificationsRead);
router.patch('/notifications/:id/read', validate(idParamSchema, 'params'), agentController.markNotificationRead);

export default router;
