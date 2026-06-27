import { Router } from 'express';
import * as customerController from '../controllers/customer.controller.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import {
  listQuerySchema,
  createCustomerSchema,
  updateCustomerSchema,
  idParamSchema,
  bookingRemindSchema,
  customerBookingParamSchema,
} from '../validators/customer.validator.js';

const router = Router();

router.get('/', authorize('customers:view'), validate(listQuerySchema, 'query'), customerController.list);
router.post('/', authorize('customers:create'), validate(createCustomerSchema), customerController.create);
router.get('/:id/account', authorize('customers:view'), validate(idParamSchema, 'params'), customerController.getAccount);
router.post(
  '/:id/bookings/:bookingId/remind',
  authorize('reminders:manage', 'notifications:manage'),
  validate(customerBookingParamSchema, 'params'),
  validate(bookingRemindSchema),
  customerController.remindBooking
);
router.get('/:id', authorize('customers:view'), validate(idParamSchema, 'params'), customerController.getById);
router.put('/:id', authorize('customers:update'), validate(idParamSchema, 'params'), validate(updateCustomerSchema), customerController.update);
router.delete('/:id', authorize('customers:delete'), validate(idParamSchema, 'params'), customerController.remove);

export default router;
