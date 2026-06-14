import { Router } from 'express';
import * as orderController from '../controllers/order.controller.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import {
  listQuerySchema,
  createOrderSchema,
  updateOrderSchema,
  updateOrderStatusSchema,
  followUpSchema,
  linkCustomerSchema,
  idParamSchema,
} from '../validators/order.validator.js';

const router = Router();

router.get('/', authorize('orders:view'), validate(listQuerySchema, 'query'), orderController.list);
router.post('/', authorize('orders:create'), validate(createOrderSchema), orderController.create);
router.get('/:id', authorize('orders:view'), validate(idParamSchema, 'params'), orderController.getById);
router.put('/:id', authorize('orders:update'), validate(idParamSchema, 'params'), validate(updateOrderSchema), orderController.update);
router.patch('/:id/status', authorize('orders:update'), validate(idParamSchema, 'params'), validate(updateOrderStatusSchema), orderController.updateStatus);
router.post('/:id/follow-up', authorize('orders:update'), validate(idParamSchema, 'params'), validate(followUpSchema), orderController.addFollowUp);
router.post('/:id/link-customer', authorize('orders:update'), validate(idParamSchema, 'params'), validate(linkCustomerSchema), orderController.linkCustomer);

export default router;
