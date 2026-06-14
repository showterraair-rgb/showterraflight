import cron from 'node-cron';
import env from '../config/env.js';
import * as reminderService from '../services/reminder.service.js';

let jobsStarted = false;

export function startReminderJobs() {
  if (jobsStarted) return;
  jobsStarted = true;

  // Daily 09:00 Asia/Dhaka — generate all reminder types
  cron.schedule(
    '0 9 * * *',
    async () => {
      console.log('[CRON] Running reminder generators...');
      try {
        const results = await reminderService.runAllGenerators();
        console.log('[CRON] Reminder generators done:', results);
      } catch (err) {
        console.error('[CRON] Reminder generator error:', err.message);
      }
    },
    { timezone: 'Asia/Dhaka' }
  );

  // Monday 09:00 — supplier payable emphasis
  cron.schedule(
    '0 9 * * 1',
    async () => {
      console.log('[CRON] Running supplier payable reminders...');
      try {
        await reminderService.generateSupplierPayableReminders();
      } catch (err) {
        console.error('[CRON] Supplier payable reminder error:', err.message);
      }
    },
    { timezone: 'Asia/Dhaka' }
  );

  // Every hour — send pending reminders
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Sending pending reminders...');
    try {
      const result = await reminderService.sendPendingReminders();
      console.log('[CRON] Reminder delivery:', result);
    } catch (err) {
      console.error('[CRON] Reminder send error:', err.message);
    }
  });

  console.log('[JOBS] Reminder cron jobs scheduled (Asia/Dhaka)');
}

export default { startReminderJobs };
