import { Router } from 'express';
import * as adminAgentController from '../controllers/adminAgent.controller.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import { agentTicketUpload } from '../middlewares/upload.js';
import {
  createAgentSchema,
  updateAgentSchema,
  listAgentsQuerySchema,
  listAgentBookingsQuerySchema,
  updateBookingStatusSchema,
  addBookingNoteSchema,
  addTransactionSchema,
  idParamSchema,
  agentIdParamSchema,
  reportQuerySchema,
} from '../validators/agent.validator.js';

const router = Router();

router.post('/agents', authorize('agents:manage'), validate(createAgentSchema), adminAgentController.create);
router.get('/agents', authorize('agents:view'), validate(listAgentsQuerySchema, 'query'), adminAgentController.list);
router.get('/agents/:id', authorize('agents:view'), validate(idParamSchema, 'params'), adminAgentController.getById);
router.patch('/agents/:id', authorize('agents:manage'), validate(idParamSchema, 'params'), validate(updateAgentSchema), adminAgentController.update);
router.patch('/agents/:id/toggle', authorize('agents:manage'), validate(idParamSchema, 'params'), adminAgentController.toggle);
router.delete('/agents/:id', authorize('agents:manage'), validate(idParamSchema, 'params'), adminAgentController.remove);
router.get('/agents/:id/bookings', authorize('agent-bookings:view'), validate(idParamSchema, 'params'), validate(listAgentBookingsQuerySchema, 'query'), adminAgentController.agentBookings);

router.get('/agent-bookings', authorize('agent-bookings:view'), validate(listAgentBookingsQuerySchema, 'query'), adminAgentController.listAllBookings);
router.get('/agent-bookings/:id', authorize('agent-bookings:view'), validate(idParamSchema, 'params'), adminAgentController.getBooking);
router.patch('/agent-bookings/:id/status', authorize('agent-bookings:manage'), validate(idParamSchema, 'params'), validate(updateBookingStatusSchema), adminAgentController.updateBookingStatus);
router.post('/agent-bookings/:id/ticket', authorize('agent-bookings:manage'), validate(idParamSchema, 'params'), agentTicketUpload.single('ticketFile'), adminAgentController.uploadTicket);
router.post('/agent-bookings/:id/note', authorize('agent-bookings:manage'), validate(idParamSchema, 'params'), validate(addBookingNoteSchema), adminAgentController.addBookingNote);

router.get('/agent-accounting/:agentId', authorize('agent-accounting:view'), validate(agentIdParamSchema, 'params'), validate(reportQuerySchema, 'query'), adminAgentController.getLedger);
router.post('/agent-accounting/:agentId', authorize('agent-accounting:manage'), validate(agentIdParamSchema, 'params'), validate(addTransactionSchema), adminAgentController.addTransaction);

export default router;
