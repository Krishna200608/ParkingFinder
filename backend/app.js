import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes.js';
import spotRoutes from './routes/spots.routes.js';
import bookingRoutes from './routes/bookings.routes.js';
import paymentRoutes from './routes/payments.routes.js';
import { validateEnv } from './utils/validateEnv.js';
import { logger, morganStream } from './utils/logger.js';
import { swaggerUi, swaggerSpec } from './utils/swagger.js';

// Resolve environment variables from backend/.env or root .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Run startup environment validation
validateEnv();

const app = express();

// HTTP request logging via Morgan + Winston (silent in automated test runs)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(':method :url :status :response-time ms - :res[content-length]', { stream: morganStream }));
}

// 1. HTTP Security Headers
app.use(helmet());

// 2. CORS configuration with credentials support
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  'https://parkingfinder-three.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin Vercel requests)
      if (!origin) return callback(null, true);

      // Allow explicitly listed origins
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Allow all Vercel production and preview deployments
      if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      console.warn(`[CORS Blocked] Origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
  })
);

// 3. Body & Cookie parsers (captures rawBody buffer for Stripe HMAC webhook signatures)
app.use(
  express.json({
    limit: '1mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());

// 4. Rate limiting: General API protection
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again later.' },
});
app.use('/api', generalLimiter);

// 5. Rate limiting: Sensitive auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, please try again after 15 minutes.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Diagnostic Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Interactive OpenAPI 3.0 Documentation UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (req, res) => res.status(200).json(swaggerSpec));

// Root API test route
app.get('/api', (req, res) => {
  res.status(200).json({ message: 'Parking Finder API is active' });
});

// Root route (for local checks)
app.get('/', (req, res) => {
  res.send('Parking Finder API is running...');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/spots', spotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled server error: ${err.message}`, { stack: err.stack, path: req.originalUrl, method: req.method });
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

export default app;

