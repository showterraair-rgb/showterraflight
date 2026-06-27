import { Router } from 'express';
import * as supplierController from '../controllers/supplier.controller.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import {
  listQuerySchema,
  createSupplierSchema,
  updateSupplierSchema,
  idParamSchema,
  bookingRemindSchema,
  supplierBookingParamSchema,
} from '../validators/supplier.validator.js';

const router = Router();

router.get('/', authorize('suppliers:view'), validate(listQuerySchema, 'query'), supplierController.list);
router.post('/', authorize('suppliers:create'), validate(createSupplierSchema), supplierController.create);
router.get('/:id/account', authorize('suppliers:view'), validate(idParamSchema, 'params'), supplierController.getAccount);
router.post(
  '/:id/bookings/:bookingId/remind',
  authorize('reminders:manage', 'notifications:manage'),
  validate(supplierBookingParamSchema, 'params'),
  validate(bookingRemindSchema),
  supplierController.remindBooking
);
router.get('/:id', authorize('suppliers:view'), validate(idParamSchema, 'params'), supplierController.getById);
router.put('/:id', authorize('suppliers:update'), validate(idParamSchema, 'params'), validate(updateSupplierSchema), supplierController.update);
router.delete('/:id', authorize('suppliers:delete'), validate(idParamSchema, 'params'), supplierController.remove);

export default router;
