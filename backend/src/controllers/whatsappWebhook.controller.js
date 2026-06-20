import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import {
  verifyWebhookChallenge,
  processWebhookPayload,
  getWebhookVerifyToken,
} from '../services/whatsappWebhook.service.js';
import WhatsAppWebhookEvent from '../models/WhatsAppWebhookEvent.js';

export const handleWhatsAppWebhookVerify = asyncHandler(async (req, res) => {
  const verifyToken = await getWebhookVerifyToken();
  const result = verifyWebhookChallenge(req.query, verifyToken);

  if (!result.verified) {
    throw ApiError.forbidden('Webhook verification failed');
  }

  await WhatsAppWebhookEvent.create({
    eventType: 'verification',
    payload: req.query,
    processed: true,
  });

  res.status(200).send(result.challenge);
});

export const handleWhatsAppWebhook = asyncHandler(async (req, res) => {
  await processWebhookPayload(req.body);
  res.status(200).json({ success: true });
});

export default {
  handleWhatsAppWebhookVerify,
  handleWhatsAppWebhook,
};
