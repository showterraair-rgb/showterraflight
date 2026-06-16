import { Router } from 'express';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import * as currencyController from '../controllers/currency.controller.js';
import { updateCurrencySchema } from '../validators/currency.validator.js';

const router = Router();

router.get('/currencies', authorize('settings:manage', 'cms:view'), currencyController.getAdminCurrencies);
router.patch('/currencies', authorize('settings:manage', 'cms:manage'), validate(updateCurrencySchema), currencyController.updateAdminCurrencies);

export default router;
