import app from './app.js';
import env from './config/env.js';
import connectDatabase from './config/database.js';
import { startScheduledJobs } from './jobs/index.js';

async function start() {
  await connectDatabase();
  startScheduledJobs();

  app.listen(env.port, () => {
    console.log(`Show Terra Air API running on port ${env.port}`);
    console.log(`Environment: ${env.nodeEnv}`);
    console.log(`API prefix: ${env.apiPrefix}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
