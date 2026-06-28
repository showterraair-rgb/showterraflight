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
  apiPublicUrl: (process.env.API_PUBLIC_URL || `http://localhost:${parseInt(process.env.PORT || '5000', 10)}`).replace(/\/$/, ''),
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  inactivityTimeoutMinutes: parseInt(process.env.INACTIVITY_TIMEOUT_MINUTES || '30', 10),
  backup: {
    dir: process.env.BACKUP_DIR || 'uploads/backups',
    cron: process.env.BACKUP_CRON || '0 2 * * *',
    offsiteDir: process.env.BACKUP_OFFSITE_DIR || '',
    rsyncTarget: process.env.BACKUP_RSYNC_TARGET || '',
  },
  sms: {
    apiUrl: process.env.BULKSMSBD_API_URL || 'http://bulksmsbd.net/api/smsapi',
    balanceUrl: process.env.BULKSMSBD_BALANCE_URL || 'http://bulksmsbd.net/api/getBalanceApi',
    apiKey: process.env.BULKSMSBD_API_KEY || '',
    senderId: process.env.BULKSMSBD_SENDER_ID || '',
    enabled: process.env.BULKSMSBD_ENABLED === 'true',
  },
  whatsapp: {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
    defaultCountryCode: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '880',
    defaultLanguageCode: process.env.WHATSAPP_DEFAULT_LANGUAGE || 'en',
    testTemplateName: process.env.WHATSAPP_TEST_TEMPLATE || 'hello_world',
    enabled: process.env.WHATSAPP_ENABLED === 'true',
  },
  wasender: {
    apiUrl: process.env.WASENDER_API_URL || 'https://www.wasenderapi.com/api/send-message',
    apiKey: process.env.WASENDER_API_KEY || '',
    enabled: process.env.WASENDER_ENABLED === 'true' || Boolean(process.env.WASENDER_API_KEY),
  },
  email: {
    smtpHost: process.env.SMTP_HOST || process.env.EMAIL_SMTP_HOST || '',
    smtpPort: parseInt(process.env.SMTP_PORT || process.env.EMAIL_SMTP_PORT || '587', 10),
    username: process.env.SMTP_USER || process.env.EMAIL_SMTP_USER || '',
    password: process.env.SMTP_PASS || process.env.EMAIL_SMTP_PASS || '',
    fromEmail: process.env.SMTP_FROM || process.env.EMAIL_FROM || '',
    fromName: process.env.SMTP_FROM_NAME || process.env.EMAIL_FROM_NAME || 'Show Terra Flight',
    encryption: process.env.SMTP_ENCRYPTION || 'tls',
    enabled: process.env.SMTP_ENABLED === 'true' || process.env.EMAIL_ENABLED === 'true',
  },
  isProduction: process.env.NODE_ENV === 'production',
};

export default env;
