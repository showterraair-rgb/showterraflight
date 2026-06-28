import { Router } from 'express';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import * as backupController from '../controllers/backup.controller.js';
import { backupIdParamSchema, restoreRequestSchema } from '../validators/backup.validator.js';

const router = Router();

router.get('/', authorize('backup:manage'), backupController.list);
router.get('/strategy', authorize('backup:manage'), backupController.strategy);
router.post('/trigger', authorize('backup:manage'), backupController.trigger);
router.get('/:id/download', authorize('backup:manage'), validate(backupIdParamSchema, 'params'), backupController.download);
router.post(
  '/:id/restore-request',
  authorize('backup:manage'),
  validate(backupIdParamSchema, 'params'),
  validate(restoreRequestSchema),
  backupController.restoreRequest
);
router.get('/:id', authorize('backup:manage'), validate(backupIdParamSchema, 'params'), backupController.getById);

export default router;
