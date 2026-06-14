import cron from 'node-cron';
import env from '../config/env.js';
import * as backupService from '../services/backup.service.js';

let jobStarted = false;

export function startBackupJob() {
  if (jobStarted) return;
  jobStarted = true;

  const schedule = env.backup.cron || '0 2 * * *';

  cron.schedule(
    schedule,
    async () => {
      console.log('[CRON] Running scheduled MongoDB backup...');
      try {
        const result = await backupService.runBackup({ backupType: 'scheduled' });
        console.log('[CRON] Backup completed:', result.fileName);
      } catch (err) {
        console.error('[CRON] Backup failed:', err.message);
      }
    },
    { timezone: 'Asia/Dhaka' }
  );

  console.log(`[JOBS] Backup cron scheduled: ${schedule} (Asia/Dhaka)`);
}

export default { startBackupJob };
