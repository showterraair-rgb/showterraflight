import { Router } from 'express';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import * as reminderController from '../controllers/reminder.controller.js';
import {
  listReminderQuerySchema,
  createReminderSchema,
  updateReminderStatusSchema,
} from '../validators/reminder.validator.js';

const router = Router();

router.get('/', authorize('reminders:view'), validate(listReminderQuerySchema, 'query'), reminderController.list);
router.post('/jobs/generate', authorize('reminders:manage'), reminderController.runGenerators);
router.post('/jobs/send', authorize('reminders:manage'), reminderController.sendPending);
router.get('/:id', authorize('reminders:view'), reminderController.getById);
router.post('/', authorize('reminders:manage'), validate(createReminderSchema), reminderController.create);
router.patch(
  '/:id/status',
  authorize('reminders:manage'),
  validate(updateReminderStatusSchema),
  reminderController.updateStatus
);

export default router;
