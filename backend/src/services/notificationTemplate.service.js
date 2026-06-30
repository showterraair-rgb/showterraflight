import NotificationTemplate from '../models/NotificationTemplate.js';
import NotificationAutomationRule from '../models/NotificationAutomationRule.js';
import { DEFAULT_AUTOMATION_RULES, DEFAULT_NOTIFICATION_TEMPLATES } from '../config/constants.js';
import ApiError from '../utils/ApiError.js';
import { logAudit } from './audit.service.js';

function formatTemplate(doc) {
  return {
    id: doc._id.toString(),
    templateKey: doc.templateKey,
    name: doc.name,
    description: doc.description || '',
    smsBody: doc.smsBody || '',
    emailSubject: doc.emailSubject || '',
    emailBody: doc.emailBody || '',
    whatsappTemplateName: doc.whatsappTemplateName || '',
    whatsappTemplateLanguage: doc.whatsappTemplateLanguage || 'en',
    whatsappParamKeys: doc.whatsappParamKeys || '',
    whatsappBody: doc.whatsappBody || '',
    supplierSmsBody: doc.supplierSmsBody || '',
    supplierEmailSubject: doc.supplierEmailSubject || '',
    supplierEmailBody: doc.supplierEmailBody || '',
    supplierWhatsappBody: doc.supplierWhatsappBody || '',
    agentSmsBody: doc.agentSmsBody || '',
    agentEmailSubject: doc.agentEmailSubject || '',
    agentEmailBody: doc.agentEmailBody || '',
    agentWhatsappBody: doc.agentWhatsappBody || '',
    isActive: Boolean(doc.isActive),
    updatedAt: doc.updatedAt,
  };
}

const TEMPLATE_CONTENT_KEYS = [
  'name',
  'smsBody',
  'emailSubject',
  'emailBody',
  'whatsappTemplateName',
  'whatsappTemplateLanguage',
  'whatsappParamKeys',
  'whatsappBody',
  'supplierSmsBody',
  'supplierEmailSubject',
  'supplierEmailBody',
  'supplierWhatsappBody',
  'agentSmsBody',
  'agentEmailSubject',
  'agentEmailBody',
  'agentWhatsappBody',
];

function mergeTemplateDefaults(formatted, fallback) {
  if (!fallback) return formatted;
  const merged = { ...formatted };
  for (const key of TEMPLATE_CONTENT_KEYS) {
    if (!merged[key] && fallback[key]) {
      merged[key] = fallback[key];
    }
  }
  return merged;
}

function formatRule(doc) {
  return {
    id: doc._id.toString(),
    eventType: doc.eventType,
    notifyCustomer: Boolean(doc.notifyCustomer),
    notifyAdmin: Boolean(doc.notifyAdmin),
    notifySupplier: Boolean(doc.notifySupplier),
    notifyAgent: Boolean(doc.notifyAgent),
    smsEnabled: Boolean(doc.smsEnabled),
    emailEnabled: Boolean(doc.emailEnabled),
    whatsappEnabled: Boolean(doc.whatsappEnabled),
    isEnabled: Boolean(doc.isEnabled),
    updatedAt: doc.updatedAt,
  };
}

export async function listTemplates() {
  const items = await NotificationTemplate.find().sort({ templateKey: 1 }).lean();
  return items.map(formatTemplate);
}

export async function getTemplateByKey(templateKey) {
  const doc = await NotificationTemplate.findOne({ templateKey }).lean();
  const fallback = DEFAULT_NOTIFICATION_TEMPLATES.find((t) => t.templateKey === templateKey);
  if (!doc) {
    if (!fallback) throw ApiError.notFound('Template not found');
    return { ...fallback, id: null, isActive: true, description: '' };
  }
  return mergeTemplateDefaults(formatTemplate(doc), fallback);
}

export async function updateTemplate(templateKey, data, userId, req) {
  const doc = await NotificationTemplate.findOneAndUpdate(
    { templateKey },
    {
      $set: {
        name: data.name,
        description: data.description ?? '',
        smsBody: data.smsBody ?? '',
        emailSubject: data.emailSubject ?? '',
        emailBody: data.emailBody ?? '',
        whatsappTemplateName: data.whatsappTemplateName ?? '',
        whatsappTemplateLanguage: data.whatsappTemplateLanguage ?? 'en',
        whatsappParamKeys: data.whatsappParamKeys ?? '',
        whatsappBody: data.whatsappBody ?? '',
        supplierSmsBody: data.supplierSmsBody ?? '',
        supplierEmailSubject: data.supplierEmailSubject ?? '',
        supplierEmailBody: data.supplierEmailBody ?? '',
        supplierWhatsappBody: data.supplierWhatsappBody ?? '',
        agentSmsBody: data.agentSmsBody ?? '',
        agentEmailSubject: data.agentEmailSubject ?? '',
        agentEmailBody: data.agentEmailBody ?? '',
        agentWhatsappBody: data.agentWhatsappBody ?? '',
        isActive: data.isActive ?? true,
        updatedBy: userId,
      },
      $setOnInsert: { templateKey },
    },
    { upsert: true, new: true, runValidators: true }
  ).lean();

  await logAudit({
    action: 'update',
    module: 'notifications',
    entityType: 'NotificationTemplate',
    entityId: doc._id,
    description: `Template updated: ${templateKey}`,
    userId,
    req,
  });

  return formatTemplate(doc);
}

export async function listAutomationRules() {
  const items = await NotificationAutomationRule.find().sort({ eventType: 1 }).lean();
  return items.map(formatRule);
}

export async function updateAutomationRule(eventType, data, userId, req) {
  const doc = await NotificationAutomationRule.findOneAndUpdate(
    { eventType },
    {
      $set: {
        notifyCustomer: data.notifyCustomer ?? false,
        notifyAdmin: data.notifyAdmin ?? false,
        notifySupplier: data.notifySupplier ?? false,
        notifyAgent: data.notifyAgent ?? false,
        smsEnabled: data.smsEnabled ?? true,
        emailEnabled: data.emailEnabled ?? true,
        whatsappEnabled: data.whatsappEnabled ?? false,
        isEnabled: data.isEnabled ?? true,
        updatedBy: userId,
      },
      $setOnInsert: { eventType },
    },
    { upsert: true, new: true, runValidators: true }
  ).lean();

  await logAudit({
    action: 'update',
    module: 'notifications',
    entityType: 'NotificationAutomationRule',
    entityId: doc._id,
    description: `Automation rule updated: ${eventType}`,
    userId,
    req,
  });

  return formatRule(doc);
}

export async function getAutomationRule(eventType) {
  const doc = await NotificationAutomationRule.findOne({ eventType }).lean();
  if (!doc) {
    const fallback = DEFAULT_AUTOMATION_RULES.find((r) => r.eventType === eventType);
    return fallback ? { ...fallback, id: null, whatsappEnabled: fallback.whatsappEnabled ?? false } : null;
  }
  return formatRule(doc);
}

export function renderTemplate(text, vars = {}) {
  if (!text) return '';
  return String(text).replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = vars[key];
    return val != null ? String(val) : '';
  });
}

export default {
  listTemplates,
  getTemplateByKey,
  updateTemplate,
  listAutomationRules,
  updateAutomationRule,
  getAutomationRule,
  renderTemplate,
};
