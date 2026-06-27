import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import authorize from '../middlewares/authorize.js';
import validate from '../middlewares/validate.js';
import {
  updateSmsSettingsSchema,
  updateEmailSettingsSchema,
  updateWhatsAppSettingsSchema,
  testSmsSchema,
  testEmailSchema,
  testWhatsAppSchema,
  updateTemplateSchema,
  updateAutomationSchema,
  templateKeyParamSchema,
  eventTypeParamSchema,
  notificationLogQuerySchema,
} from '../validators/notification.validator.js';

const router = Router();

router.get('/settings/sms', authorize('notifications:view', 'settings:manage'), notificationController.getSmsSettings);
router.put('/settings/sms', authorize('notifications:manage', 'settings:manage'), validate(updateSmsSettingsSchema), notificationController.updateSmsSettings);
router.post('/settings/sms/test', authorize('notifications:manage', 'settings:manage'), validate(testSmsSchema), notificationController.testSms);
router.get('/settings/sms/balance', authorize('notifications:view', 'settings:manage'), notificationController.smsBalance);

router.get('/settings/email', authorize('notifications:view', 'settings:manage'), notificationController.getEmailSettings);
router.put('/settings/email', authorize('notifications:manage', 'settings:manage'), validate(updateEmailSettingsSchema), notificationController.updateEmailSettings);
router.post('/settings/email/test', authorize('notifications:manage', 'settings:manage'), validate(testEmailSchema), notificationController.testEmail);

router.get('/settings/whatsapp', authorize('notifications:view', 'settings:manage'), notificationController.getWhatsAppSettings);
router.put('/settings/whatsapp', authorize('notifications:manage', 'settings:manage'), validate(updateWhatsAppSettingsSchema), notificationController.updateWhatsAppSettings);
router.post('/settings/whatsapp/test', authorize('notifications:manage', 'settings:manage'), validate(testWhatsAppSchema), notificationController.testWhatsApp);

router.get('/templates', authorize('notifications:view', 'settings:manage'), notificationController.listTemplates);
router.get('/templates/:templateKey', authorize('notifications:view', 'settings:manage'), validate(templateKeyParamSchema, 'params'), notificationController.getTemplate);
router.put('/templates/:templateKey', authorize('notifications:manage', 'settings:manage'), validate(templateKeyParamSchema, 'params'), validate(updateTemplateSchema), notificationController.updateTemplate);

router.get('/automation', authorize('notifications:view', 'settings:manage'), notificationController.listAutomationRules);
router.put('/automation/:eventType', authorize('notifications:manage', 'settings:manage'), validate(eventTypeParamSchema, 'params'), validate(updateAutomationSchema), notificationController.updateAutomationRule);

router.get('/logs', authorize('notifications:view', 'settings:manage'), validate(notificationLogQuerySchema, 'query'), notificationController.listLogs);

router.get('/jobs/daily-ledger/preview', authorize('notifications:manage', 'settings:manage'), notificationController.previewDailyLedger);
router.post('/jobs/daily-ledger', authorize('notifications:manage', 'settings:manage'), notificationController.triggerDailyLedger);

export default router;
