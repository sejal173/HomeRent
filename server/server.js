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
import connectDB from './config/db.js';

// Connect to MongoDB
connectDB();

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
// cors: Allows our React frontend (running on port 5173) to call this API
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// express.json(): Parses incoming JSON request bodies (req.body)
app.use(express.json());

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

// ── Global Error Handler ────────────────────────────────────────────────────
// If any route throws an error, this catches it and sends a clean JSON response
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// ── Start Server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
