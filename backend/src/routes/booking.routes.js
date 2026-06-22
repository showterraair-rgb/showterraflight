import { Router } from 'express';
import * as bookingController from '../controllers/booking.controller.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import {
  listQuerySchema,
  createBookingSchema,
  createBookingFromOrderSchema,
  updateBookingSchema,
  updateBookingStatusSchema,
  addBookingNoteSchema,
  fromOrderParamSchema,
  idParamSchema,
  voidBookingSchema,
  refundBookingSchema,
  reissueBookingSchema,
} from '../validators/booking.validator.js';
import { updateApprovalSchema } from '../validators/approval.validator.js';
import { passportUpload, bookingTicketUpload } from '../middlewares/upload.js';

const router = Router();

router.get('/', authorize('bookings:view'), validate(listQuerySchema, 'query'), bookingController.list);
router.get('/summary', authorize('bookings:view'), validate(listQuerySchema, 'query'), bookingController.summary);
router.post('/', authorize('bookings:create'), validate(createBookingSchema), bookingController.create);
router.post('/from-order/:orderId', authorize('bookings:create'), validate(fromOrderParamSchema, 'params'), validate(createBookingFromOrderSchema), bookingController.createFromOrder);
router.get('/:id', authorize('bookings:view'), validate(idParamSchema, 'params'), bookingController.getById);
router.put('/:id', authorize('bookings:update'), validate(idParamSchema, 'params'), validate(updateBookingSchema), bookingController.update);
router.patch('/:id/status', authorize('bookings:update'), validate(idParamSchema, 'params'), validate(updateBookingStatusSchema), bookingController.updateStatus);
router.post('/:id/void', authorize('bookings:update'), validate(idParamSchema, 'params'), validate(voidBookingSchema), bookingController.voidBooking);
router.post('/:id/refund', authorize('bookings:update', 'payments:customer'), validate(idParamSchema, 'params'), validate(refundBookingSchema), bookingController.refundBooking);
router.post('/:id/reissue', authorize('bookings:update', 'bookings:create'), validate(idParamSchema, 'params'), validate(reissueBookingSchema), bookingController.reissueBooking);
router.patch('/:id/approval', authorize('bookings:update'), validate(idParamSchema, 'params'), validate(updateApprovalSchema), bookingController.updateApproval);
router.post('/:id/passport', authorize('bookings:update'), validate(idParamSchema, 'params'), passportUpload.single('passport'), bookingController.uploadPassport);
router.post('/:id/ticket', authorize('bookings:update'), validate(idParamSchema, 'params'), bookingTicketUpload.single('ticketFile'), bookingController.uploadTicketCopy);
router.post('/:id/notes', authorize('bookings:update'), validate(idParamSchema, 'params'), validate(addBookingNoteSchema), bookingController.addNote);
router.get('/:id/timeline', authorize('bookings:view'), validate(idParamSchema, 'params'), bookingController.getTimeline);
router.get('/:id/invoice/pdf', authorize('bookings:view'), validate(idParamSchema, 'params'), bookingController.downloadInvoicePdf);
router.delete('/:id', authorize('bookings:delete'), validate(idParamSchema, 'params'), bookingController.remove);

export default router;
