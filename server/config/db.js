// config/db.js
// This file connects our server to the MongoDB database.
// We read the connection string from the .env file — never hardcode it here.
// dotenv is already loaded in server.js BEFORE this file is imported, so
// process.env.MONGO_URI is available here.

import mongoose from 'mongoose';
import dns from 'dns';

// DNS FIX: Force Node.js to prefer IPv4 addresses when doing DNS lookups.
// Why? On some Windows/ISP networks Node.js tries IPv6 first.
// MongoDB Atlas only accepts IPv4, so we get ECONNREFUSED without this line.
dns.setDefaultResultOrder('ipv4first');

const connectDB = async () => {
  // ── Guard: stop immediately if MONGO_URI is missing ──────────────────────
  if (!process.env.MONGO_URI) {
    console.error('❌ FATAL: MONGO_URI is not defined in server/.env');
    console.error('   → Open server/.env and set: MONGO_URI=mongodb+srv://...');
    process.exit(1);
  }

  // ── Safe host-only debug log (never prints username or password) ──────────
  const uri = process.env.MONGO_URI;
  const isAtlas = uri.startsWith('mongodb+srv');
  let host = 'unknown';
  try {
    // For Atlas: mongodb+srv://user:pass@cluster0.xxx.mongodb.net/db
    // For local:  mongodb://127.0.0.1:27017/db
    host = new URL(uri).hostname;
  } catch {
    // URL parse failed — still attempt connection
  }

  console.log(`🔌 Connecting to MongoDB host: ${host}`);

  if (isAtlas) {
    // Atlas host should look like: cluster0.kigyov5.mongodb.net (4 parts when split by '.')
    const parts = host.split('.');
    if (parts.length < 4) {
      console.warn('⚠️  WARNING: Your MONGO_URI host looks incomplete!');
      console.warn(`   Got:      ${host}`);
      console.warn('   Expected: cluster0.<cluster-id>.mongodb.net');
      console.warn('   → In MongoDB Atlas: click "Connect" → Drivers → copy the full string.');
    }
  }

  // ── Attempt the connection ────────────────────────────────────────────────
  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    if (!isAtlas && error.code === 'ECONNREFUSED') {
      console.error('   Local MongoDB is not running.');
      console.error('   → Start the "MongoDB Server" service in Windows Services,');
      console.error('     or install MongoDB Community Server.');
    } else if (isAtlas) {
      console.error('   Common Atlas fixes:');
      console.error('   1. Copy the FULL connection string from Atlas → Connect → Drivers');
      console.error('   2. Network Access → add your IP (or 0.0.0.0/0 for dev)');
      console.error('   3. Double-check your Atlas username and password');
    }
    process.exit(1);
  }
};

export default connectDB;
