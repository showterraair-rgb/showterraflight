import { Router } from 'express';
import * as whatsappWebhookController from '../controllers/whatsappWebhook.controller.js';

const router = Router();

router.get('/', whatsappWebhookController.handleWhatsAppWebhookVerify);
router.post('/', whatsappWebhookController.handleWhatsAppWebhook);

export default router;
