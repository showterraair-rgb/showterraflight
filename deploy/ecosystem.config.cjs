/**
 * PM2 ecosystem — Show Terra Air backend API
 *
 * Usage (on VPS as deploy user):
 *   cd /var/www/show-terra-air
 *   pm2 start deploy/ecosystem.config.cjs --env production
 *   pm2 save
 *
 * Assumes backend .env exists at backend/.env (see deploy/env/backend.production.env.example)
 */

module.exports = {
  apps: [
    {
      name: 'sta-api',
      cwd: './backend',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      merge_logs: true,
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
