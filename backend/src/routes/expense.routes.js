import { Router } from 'express';
import * as expenseController from '../controllers/expense.controller.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import {
  listQuerySchema,
  createExpenseSchema,
  idParamSchema,
} from '../validators/expense.validator.js';

const router = Router();

router.get('/categories', authorize('expenses:view'), expenseController.listCategories);
router.get('/', authorize('expenses:view'), validate(listQuerySchema, 'query'), expenseController.list);
router.post('/', authorize('expenses:create'), validate(createExpenseSchema), expenseController.create);
router.get('/:id', authorize('expenses:view'), validate(idParamSchema, 'params'), expenseController.getById);

export default router;
