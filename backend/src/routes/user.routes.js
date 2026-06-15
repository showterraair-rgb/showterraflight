import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import {
  listQuerySchema,
  createUserSchema,
  updateUserSchema,
  idParamSchema,
} from '../validators/user.validator.js';

const router = Router();

router.get('/', authorize('users:view'), validate(listQuerySchema, 'query'), userController.list);
router.post('/', authorize('users:manage'), validate(createUserSchema), userController.create);
router.get('/:id', authorize('users:view'), validate(idParamSchema, 'params'), userController.getById);
router.put('/:id', authorize('users:manage'), validate(idParamSchema, 'params'), validate(updateUserSchema), userController.update);
router.delete('/:id', authorize('users:manage'), validate(idParamSchema, 'params'), userController.remove);

export default router;
