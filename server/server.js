// server.js
// Entry point: loads .env, connects to MongoDB, starts the HTTP server.
// The Express app itself is defined in app.js so it can be imported by tests.

import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

// __dirname does not exist in ES modules — recreate it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the server/ folder before anything else.
// override: true replaces any matching system environment variable.
dotenv.config({
  path: path.resolve(__dirname, '.env'),
  override: true,
});

import connectDB from './config/db.js';
import { createApp } from './app.js';

// Connect to MongoDB
connectDB();

// Create the Express app
const app = createApp();

// Start HTTP server on all interfaces (no host restriction)
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
