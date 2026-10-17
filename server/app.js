// app.js
// Creates and configures the Express app without starting the server.
// Exported so that both server.js and tests can use the same app.

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import userRoutes from './routes/userRoutes.js';

export function createApp() {
  const app = express();

  // ── 1. CORS Configuration (runs first to allow preflight and cross-origin calls) ──
  const envOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, '');

      // In development: allow any port on localhost or 127.0.0.1
      if (process.env.NODE_ENV !== 'production') {
        const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin);
        if (isLocalhost) {
          return callback(null, true);
        }
      }

      if (envOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS error: Origin ${origin} not allowed`));
    },
    credentials: true,
  }));

  // ── 2. Security Headers (configured not to block cross-origin API responses) ──
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // Limit JSON body to 10kb to prevent payload DoS
  app.use(express.json({ limit: '10kb' }));

  // ── Routes ────────────────────────────────────────────────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/properties', propertyRoutes);
  app.use('/api/users', userRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'HomeRent API is running 🚀' });
  });

  // ── Central Error Handling ────────────────────────────────────────────────
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
