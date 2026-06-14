import { Router } from 'express';
import * as accountController from '../controllers/account.controller.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import {
  listQuerySchema,
  openingBalanceSchema,
  createTransferSchema,
  idParamSchema,
} from '../validators/account.validator.js';

const router = Router();

router.get('/', authorize('accounts:view'), accountController.list);
router.get('/summary', authorize('accounts:view'), accountController.summary);
router.get('/transfers', authorize('accounts:view'), validate(listQuerySchema, 'query'), accountController.listTransfers);
router.post('/transfers', authorize('transfers:create'), validate(createTransferSchema), accountController.createTransfer);
router.get('/:id/statement', authorize('accounts:view'), validate(idParamSchema, 'params'), validate(listQuerySchema, 'query'), accountController.statement);
router.put('/:id/opening-balance', authorize('accounts:manage'), validate(idParamSchema, 'params'), validate(openingBalanceSchema), accountController.setOpeningBalance);
router.get('/:id', authorize('accounts:view'), validate(idParamSchema, 'params'), accountController.getById);

export default router;
