import { Router } from 'express';
import * as customerController from '../controllers/customer.controller.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import {
  listQuerySchema,
  createCustomerSchema,
  updateCustomerSchema,
  idParamSchema,
} from '../validators/customer.validator.js';

const router = Router();

router.get('/', authorize('customers:view'), validate(listQuerySchema, 'query'), customerController.list);
router.post('/', authorize('customers:create'), validate(createCustomerSchema), customerController.create);
router.get('/:id', authorize('customers:view'), validate(idParamSchema, 'params'), customerController.getById);
router.put('/:id', authorize('customers:update'), validate(idParamSchema, 'params'), validate(updateCustomerSchema), customerController.update);

export default router;
