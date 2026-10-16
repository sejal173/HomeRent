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
  try {
    const url = new URL(process.env.MONGO_URI);
    const host = url.hostname; // e.g. "cluster0.kigyov5.mongodb.net"

    console.log(`🔌 Connecting to MongoDB host: ${host}`);

    // Warning: a correct Atlas host has TWO dots and a cluster-id segment
    // e.g. cluster0.kigyov5.mongodb.net  ← correct (3 parts)
    //      cluster0.mongodb.net           ← incomplete placeholder (2 parts only)
    const parts = host.split('.');
    if (parts.length < 4) {
      console.warn('⚠️  WARNING: Your MONGO_URI host looks incomplete!');
      console.warn(`   Got:      ${host}`);
      console.warn('   Expected: cluster0.<cluster-id>.mongodb.net');
      console.warn('   → In MongoDB Atlas: click "Connect" on your cluster,');
      console.warn('     choose "Drivers", and copy the full connection string.');
    }
  } catch {
    console.error('❌ MONGO_URI format looks wrong. It must start with mongodb+srv://');
    process.exit(1);
  }

  // ── Attempt the connection ────────────────────────────────────────────────
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.error('');
    console.error('   Common fixes:');
    console.error('   1. Copy the FULL connection string from Atlas → Connect → Drivers');
    console.error('      It should look like: mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/homerent');
    console.error('   2. In MongoDB Atlas → Network Access → add your IP (or 0.0.0.0/0 for dev)');
    console.error('   3. Double-check your Atlas username and password');
    process.exit(1);
  }
};

export default connectDB;
