import { Router } from 'express';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import * as liveStreamController from '../controllers/liveStream.controller.js';
import {
  createLiveStreamSchema,
  updateLiveStreamSchema,
  liveStreamListQuerySchema,
} from '../validators/liveStream.validator.js';

const router = Router();

router.get('/summary', authorize('livestream:view'), liveStreamController.summary);
router.get('/', authorize('livestream:view'), validate(liveStreamListQuerySchema, 'query'), liveStreamController.list);
router.get('/:id', authorize('livestream:view'), liveStreamController.getById);
router.post('/', authorize('livestream:manage'), validate(createLiveStreamSchema), liveStreamController.create);
router.put('/:id', authorize('livestream:manage'), validate(updateLiveStreamSchema), liveStreamController.update);
router.delete('/:id', authorize('livestream:manage'), liveStreamController.remove);
router.post('/:id/go-live', authorize('livestream:manage'), liveStreamController.goLive);
router.post('/:id/end', authorize('livestream:manage'), liveStreamController.end);

export default router;
