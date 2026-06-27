import cron from 'node-cron';
import {
  sendDailyLedgerNotifyToAdmin,
  syncDailyLedgerNotificationDefaults,
  syncManualBookingNotificationDefaults,
  syncRrvNotificationDefaults,
} from '../services/ledgerSummary.service.js';

let started = false;

export function startLedgerJob() {
  if (started) return;
  started = true;

  syncDailyLedgerNotificationDefaults().catch((err) => {
    console.warn('[CRON] Daily ledger notification defaults sync failed:', err.message);
  });

  syncManualBookingNotificationDefaults().catch((err) => {
    console.warn('[CRON] Manual booking notification defaults sync failed:', err.message);
  });

  syncRrvNotificationDefaults().catch((err) => {
    console.warn('[CRON] RRV notification defaults sync failed:', err.message);
  });

  // Daily 11:00 PM Asia/Dhaka — admin SMS + WhatsApp summary
  cron.schedule(
    '0 23 * * *',
    async () => {
      console.log('[CRON] Sending daily ledger summary (SMS + WhatsApp)...');
      try {
        const result = await sendDailyLedgerNotifyToAdmin();
        console.log('[CRON] Daily ledger summary done:', result.skipped ? result.reason : 'sent');
      } catch (err) {
        console.error('[CRON] Daily ledger summary error:', err.message);
      }
    },
    { timezone: 'Asia/Dhaka' }
  );

  console.log('[CRON] Daily ledger summary scheduled (23:00 Asia/Dhaka — SMS + WhatsApp)');
}

export default { startLedgerJob };
