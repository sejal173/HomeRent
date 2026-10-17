// server.js
// This is the main entry point for our backend.
// It starts the Express server, connects to MongoDB, and registers all routes.

// ── IMPORTANT: dotenv MUST be the very first import and must run before anything else.
// We use an absolute path (fileURLToPath + path.resolve) so it works correctly
// no matter which folder you run `npm run dev` from.
// override: true → forces our .env values to replace any old MONGO_URI that might
// already be set as a Windows/system environment variable.

import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

// __dirname does not exist in ES modules — we recreate it using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the exact server/ folder, always — regardless of where node is run from
dotenv.config({
  path: path.resolve(__dirname, '.env'),
  override: true,   // Replace any existing system env variable with the same name
});

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Connect to MongoDB
connectDB();

const app = express();

// ── Security & Utility Middleware ───────────────────────────────────────────
// helmet: Sets secure HTTP headers (XSS, clickjacking, MIME sniffing protection)
app.use(helmet());

// cors: Allows our React frontend to call this API (origin from env with safe default)
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: clientOrigin,
  credentials: true,
}));

// express.json(): Parses incoming JSON request bodies (limited to 10kb to prevent payload DoS attacks)
app.use(express.json({ limit: '10kb' }));

// ── Routes ──────────────────────────────────────────────────────────────────
import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import userRoutes from './routes/userRoutes.js';

app.use('/api/auth', authRoutes);           // Auth endpoints
app.use('/api/properties', propertyRoutes); // Property endpoints
app.use('/api/users', userRoutes);          // User endpoints

// Health check endpoint — useful to confirm the server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HomeRent API is running 🚀' });
});

// ── Central Error Handling Middleware ───────────────────────────────────────
// Catches 404 for undefined routes and formats server errors into clean JSON
app.use(notFound);
app.use(errorHandler);

// ── Start Server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
