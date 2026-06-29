/**
 * Sync missing notification templates and automation rules from constants defaults.
 * Safe to run on production — upserts templates and adds missing rules without disabling existing ones.
 *
 * Usage: node src/scripts/syncNotificationDefaults.js
 */
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import NotificationTemplate from '../models/NotificationTemplate.js';
import NotificationAutomationRule from '../models/NotificationAutomationRule.js';
import {
  DEFAULT_NOTIFICATION_TEMPLATES,
  DEFAULT_AUTOMATION_RULES,
} from '../config/constants.js';

async function run() {
  await mongoose.connect(env.mongodbUri);

  let templates = 0;
  for (const tpl of DEFAULT_NOTIFICATION_TEMPLATES) {
    const existing = await NotificationTemplate.findOne({ templateKey: tpl.templateKey }).lean();
    if (!existing) {
      await NotificationTemplate.create({
        ...tpl,
        whatsappBody: tpl.whatsappBody || tpl.smsBody || '',
        isActive: true,
      });
      templates += 1;
      continue;
    }
    const patch = {};
    for (const key of Object.keys(tpl)) {
      if (key === 'templateKey') continue;
      if (key.startsWith('supplier') || key.startsWith('agent')) {
        if (!existing[key] && tpl[key]) patch[key] = tpl[key];
      }
    }
    if (Object.keys(patch).length) {
      await NotificationTemplate.updateOne({ templateKey: tpl.templateKey }, { $set: patch });
      templates += 1;
    }
  }

  let rules = 0;
  for (const rule of DEFAULT_AUTOMATION_RULES) {
    const existing = await NotificationAutomationRule.findOne({ eventType: rule.eventType }).lean();
    if (!existing) {
      await NotificationAutomationRule.create(rule);
      rules += 1;
      continue;
    }
    const patch = {};
    if (existing.notifySupplier == null && rule.notifySupplier != null) patch.notifySupplier = rule.notifySupplier;
    if (existing.notifyAgent == null && rule.notifyAgent != null) patch.notifyAgent = rule.notifyAgent;
    if (Object.keys(patch).length) {
      await NotificationAutomationRule.updateOne({ eventType: rule.eventType }, { $set: patch });
      rules += 1;
    }
  }

  console.log(`Synced notification defaults: ${templates} new templates, ${rules} rules added/updated`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
