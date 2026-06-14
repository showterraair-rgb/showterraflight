import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import {
  listQuerySchema,
  createCustomerPaymentSchema,
  createSupplierPaymentSchema,
  idParamSchema,
} from '../validators/payment.validator.js';

const router = Router();

router.get('/customers', authorize('payments:customer'), validate(listQuerySchema, 'query'), paymentController.listCustomerPayments);
router.post('/customers', authorize('payments:customer'), validate(createCustomerPaymentSchema), paymentController.createCustomerPayment);
router.get('/customers/:id', authorize('payments:customer'), validate(idParamSchema, 'params'), paymentController.getCustomerPayment);

router.get('/suppliers', authorize('payments:supplier'), validate(listQuerySchema, 'query'), paymentController.listSupplierPayments);
router.post('/suppliers', authorize('payments:supplier'), validate(createSupplierPaymentSchema), paymentController.createSupplierPayment);
router.get('/suppliers/:id', authorize('payments:supplier'), validate(idParamSchema, 'params'), paymentController.getSupplierPayment);

export default router;
