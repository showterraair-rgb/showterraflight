import { Router } from 'express';

import * as paymentController from '../controllers/payment.controller.js';

import authorize from '../middlewares/authorize.js';

import validate from '../middlewares/validate.js';

import {

  listQuerySchema,

  createCustomerPaymentSchema,

  createSupplierPaymentSchema,

  voidReasonSchema,

  idParamSchema,

} from '../validators/payment.validator.js';

import {
  listPaymentRequestQuerySchema,
  createPaymentRequestSchema,
  recordPaymentRequestSchema,
  cancelPaymentRequestSchema,
  paymentRequestIdParamSchema,
} from '../validators/paymentRequest.validator.js';
import {
  initiateSslcommerzSchema,
  initiateBkashSchema,
  initiateGatewaySchema,
  updateGatewaySettingsSchema,
} from '../validators/gateway.validator.js';
import * as gatewayController from '../controllers/gateway.controller.js';



const router = Router();



router.get('/requests', authorize('payments:customer'), validate(listPaymentRequestQuerySchema, 'query'), paymentController.listPaymentRequests);

router.post('/requests', authorize('payments:customer'), validate(createPaymentRequestSchema), paymentController.createPaymentRequest);

router.post('/requests/:id/cancel', authorize('payments:customer'), validate(paymentRequestIdParamSchema, 'params'), validate(cancelPaymentRequestSchema), paymentController.cancelPaymentRequest);

router.post('/requests/:id/record', authorize('payments:customer'), validate(paymentRequestIdParamSchema, 'params'), validate(recordPaymentRequestSchema), paymentController.recordPaymentRequest);

router.get('/gateway/status', authorize('payments:customer', 'accounts:view'), gatewayController.getGatewayStatusHandler);
router.get('/gateway/settings', authorize('accounts:view', 'settings:manage'), gatewayController.getGatewaySettings);
router.patch('/gateway/settings', authorize('settings:manage', 'accounts:view'), validate(updateGatewaySettingsSchema), gatewayController.updateGatewaySettings);
router.post('/gateway/initiate', authorize('payments:customer'), validate(initiateGatewaySchema), gatewayController.initiateGateway);
router.post('/gateway/sslcommerz/initiate', authorize('payments:customer'), validate(initiateSslcommerzSchema), gatewayController.initiateSslcommerz);
router.post('/gateway/bkash/initiate', authorize('payments:customer'), validate(initiateBkashSchema), gatewayController.initiateBkash);
router.get('/gateway/transactions/:tranId', authorize('payments:customer'), gatewayController.getGatewayPayment);



router.get('/customers', authorize('payments:customer'), validate(listQuerySchema, 'query'), paymentController.listCustomerPayments);

router.post('/customers', authorize('payments:customer'), validate(createCustomerPaymentSchema), paymentController.createCustomerPayment);

router.get('/customers/:id', authorize('payments:customer'), validate(idParamSchema, 'params'), paymentController.getCustomerPayment);

router.post('/customers/:id/void', authorize('payments:customer'), validate(idParamSchema, 'params'), validate(voidReasonSchema), paymentController.voidCustomerPayment);



router.get('/suppliers', authorize('payments:supplier'), validate(listQuerySchema, 'query'), paymentController.listSupplierPayments);

router.post('/suppliers', authorize('payments:supplier'), validate(createSupplierPaymentSchema), paymentController.createSupplierPayment);

router.get('/suppliers/:id', authorize('payments:supplier'), validate(idParamSchema, 'params'), paymentController.getSupplierPayment);

router.post('/suppliers/:id/void', authorize('payments:supplier'), validate(idParamSchema, 'params'), validate(voidReasonSchema), paymentController.voidSupplierPayment);



export default router;


