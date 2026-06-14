import { Router } from 'express';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import * as cmsController from '../controllers/cms.controller.js';
import {
  updatePageSchema,
  createNoticeSchema,
  updateNoticeSchema,
  updateCompanySchema,
  updateLogoSchema,
} from '../validators/cms.validator.js';

const router = Router();

router.get('/pages', authorize('cms:view'), cmsController.listPages);
router.get('/pages/:pageKey', authorize('cms:view'), cmsController.getPage);
router.put('/pages/:pageKey', authorize('cms:manage'), validate(updatePageSchema), cmsController.updatePage);

router.get('/notices', authorize('cms:view'), cmsController.listNotices);
router.get('/notices/:id', authorize('cms:view'), cmsController.getNotice);
router.post('/notices', authorize('cms:manage'), validate(createNoticeSchema), cmsController.createNotice);
router.put('/notices/:id', authorize('cms:manage'), validate(updateNoticeSchema), cmsController.updateNotice);
router.delete('/notices/:id', authorize('cms:manage'), cmsController.deleteNotice);

router.get('/settings', authorize('cms:view'), cmsController.getSettings);
router.put('/settings', authorize('cms:manage'), validate(updateCompanySchema), cmsController.updateSettings);
router.put('/logo', authorize('cms:manage'), validate(updateLogoSchema), cmsController.updateLogo);

export default router;
