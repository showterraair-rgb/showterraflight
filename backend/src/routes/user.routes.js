import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import { staffDocumentUpload } from '../middlewares/upload.js';
import {
  listQuerySchema,
  createUserSchema,
  updateUserSchema,
  setUserStatusSchema,
  idParamSchema,
} from '../validators/user.validator.js';

const router = Router();

router.get('/', authorize('users:view'), validate(listQuerySchema, 'query'), userController.list);
router.post('/', authorize('users:manage'), validate(createUserSchema), userController.create);
router.get('/:id', authorize('users:view'), validate(idParamSchema, 'params'), userController.getById);
router.put('/:id', authorize('users:manage'), validate(idParamSchema, 'params'), validate(updateUserSchema), userController.update);
router.patch('/:id/status', authorize('users:manage'), validate(idParamSchema, 'params'), validate(setUserStatusSchema), userController.setStatus);
router.post('/:id/documents/:docType', authorize('users:manage'), validate(idParamSchema, 'params'), staffDocumentUpload.single('document'), userController.uploadDocument);
router.delete('/:id', authorize('users:manage'), validate(idParamSchema, 'params'), userController.remove);

export default router;
