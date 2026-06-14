import { Router } from 'express';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import * as reportController from '../controllers/report.controller.js';
import { reportQuerySchema } from '../validators/report.validator.js';

const router = Router();

router.get('/', authorize('reports:view'), reportController.listTypes);
router.get('/:reportKey/export/csv', authorize('reports:export'), validate(reportQuerySchema, 'query'), reportController.exportCsv);
router.get('/:reportKey/export/pdf', authorize('reports:export'), validate(reportQuerySchema, 'query'), reportController.exportPdf);
router.get('/:reportKey', authorize('reports:view'), validate(reportQuerySchema, 'query'), reportController.run);

export default router;
