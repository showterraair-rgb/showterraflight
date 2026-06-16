import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const required = ['MONGODB_URI', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  mongodbUri: process.env.MONGODB_URI,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    cookieName: process.env.JWT_COOKIE_NAME || 'sta_token',
    agentCookieName: process.env.JWT_AGENT_COOKIE_NAME || 'sta_agent_token',
  },
  cookie: {
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
  },
  cors: {
    publicUrl: process.env.CLIENT_PUBLIC_URL || 'http://localhost:5173',
    adminUrl: process.env.CLIENT_ADMIN_URL || 'http://localhost:5174',
    agentUrl: process.env.CLIENT_AGENT_URL || 'http://localhost:5175',
  },
  upload: {
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
    dir: process.env.UPLOAD_DIR || 'uploads',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  inactivityTimeoutMinutes: parseInt(process.env.INACTIVITY_TIMEOUT_MINUTES || '30', 10),
  backup: {
    dir: process.env.BACKUP_DIR || 'uploads/backups',
    cron: process.env.BACKUP_CRON || '0 2 * * *',
  },
  sms: {
    apiUrl: process.env.BULKSMSBD_API_URL || 'http://bulksmsbd.net/api/smsapi',
    balanceUrl: process.env.BULKSMSBD_BALANCE_URL || 'http://bulksmsbd.net/api/getBalanceApi',
    apiKey: process.env.BULKSMSBD_API_KEY || '',
    senderId: process.env.BULKSMSBD_SENDER_ID || '',
    enabled: process.env.BULKSMSBD_ENABLED === 'true',
  },
  isProduction: process.env.NODE_ENV === 'production',
};

export default env;
