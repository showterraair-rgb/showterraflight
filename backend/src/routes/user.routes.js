/** Users — Phase 2/5 | Permissions: users:* */
import { Router } from 'express';
const router = Router();
router.all('*', (_req, res) => res.status(501).json({ success: false, message: 'Users — Phase 2' }));
export default router;
