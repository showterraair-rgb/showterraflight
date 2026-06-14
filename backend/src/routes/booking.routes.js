import { Router } from 'express';
import * as bookingController from '../controllers/booking.controller.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import {
  listQuerySchema,
  createBookingSchema,
  updateBookingSchema,
  updateBookingStatusSchema,
  addBookingNoteSchema,
  fromOrderParamSchema,
  idParamSchema,
} from '../validators/booking.validator.js';

const router = Router();

router.get('/', authorize('bookings:view'), validate(listQuerySchema, 'query'), bookingController.list);
router.post('/', authorize('bookings:create'), validate(createBookingSchema), bookingController.create);
router.post('/from-order/:orderId', authorize('bookings:create'), validate(fromOrderParamSchema, 'params'), validate(createBookingSchema.partial()), bookingController.createFromOrder);
router.get('/:id', authorize('bookings:view'), validate(idParamSchema, 'params'), bookingController.getById);
router.put('/:id', authorize('bookings:update'), validate(idParamSchema, 'params'), validate(updateBookingSchema), bookingController.update);
router.patch('/:id/status', authorize('bookings:update'), validate(idParamSchema, 'params'), validate(updateBookingStatusSchema), bookingController.updateStatus);
router.post('/:id/notes', authorize('bookings:update'), validate(idParamSchema, 'params'), validate(addBookingNoteSchema), bookingController.addNote);
router.get('/:id/timeline', authorize('bookings:view'), validate(idParamSchema, 'params'), bookingController.getTimeline);

export default router;
