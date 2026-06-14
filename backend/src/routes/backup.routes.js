import { Router } from 'express';
import authorize from '../middlewares/authorize.js';
import * as backupController from '../controllers/backup.controller.js';

const router = Router();

router.get('/', authorize('backup:manage'), backupController.list);
router.get('/strategy', authorize('backup:manage'), backupController.strategy);
router.get('/:id', authorize('backup:manage'), backupController.getById);
router.post('/trigger', authorize('backup:manage'), backupController.trigger);

export default router;
