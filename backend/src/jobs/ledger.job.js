import cron from 'node-cron';
import { sendDailyLedgerSmsToAdmin } from '../services/ledgerSummary.service.js';

let started = false;

export function startLedgerJob() {
  if (started) return;
  started = true;

  // Daily 11:00 PM Asia/Dhaka — admin ledger SMS
  cron.schedule(
    '0 23 * * *',
    async () => {
      console.log('[CRON] Sending daily ledger SMS...');
      try {
        const result = await sendDailyLedgerSmsToAdmin();
        console.log('[CRON] Daily ledger SMS done:', result);
      } catch (err) {
        console.error('[CRON] Daily ledger SMS error:', err.message);
      }
    },
    { timezone: 'Asia/Dhaka' }
  );

  console.log('[CRON] Ledger job scheduled (23:00 Asia/Dhaka)');
}

export default { startLedgerJob };
