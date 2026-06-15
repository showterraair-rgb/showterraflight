import { startReminderJobs } from './reminder.job.js';
import { startBackupJob } from './backup.job.js';
import { startLedgerJob } from './ledger.job.js';

export function startScheduledJobs() {
  startReminderJobs();
  startBackupJob();
  startLedgerJob();
}

export default { startScheduledJobs };
