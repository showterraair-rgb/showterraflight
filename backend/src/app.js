import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import env from './config/env.js';
import apiRoutes from './routes/index.js';
import errorHandler from './middlewares/errorHandler.js';
import { isAuthApiRoute, isAuthenticatedRequest, rateLimitKey } from './utils/rateLimitKey.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: [env.cors.publicUrl, env.cors.adminUrl, env.cors.agentUrl],
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());

app.use(
  rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: rateLimitKey,
    skip: (req) => isAuthApiRoute(req) || isAuthenticatedRequest(req),
    message: { success: false, message: 'Too many requests. Please try again shortly.' },
  })
);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(env.apiPrefix, apiRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

export default app;
