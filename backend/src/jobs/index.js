import { startReminderJobs } from './reminder.job.js';
import { startBackupJob } from './backup.job.js';

export function startScheduledJobs() {
  startReminderJobs();
  startBackupJob();
}

export default { startScheduledJobs };
