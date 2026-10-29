// seed/createAdmin.js
// Securely provisions or updates the primary system administrator account.
//
// Usage: node seed/createAdmin.js [--force]
// Requires: ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD in server/.env

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from '../models/User.js';
import connectDB from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
  override: true,
});

const isForce = process.argv.includes('--force');

const run = async () => {
  const name = process.env.ADMIN_NAME || 'Admin User';
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email) {
    console.error('❌ Error: ADMIN_EMAIL environment variable must be specified.');
    console.error('   Please add ADMIN_EMAIL to your server/.env before running this script.');
    process.exit(1);
  }

  if (!password) {
    console.error('❌ Error: ADMIN_PASSWORD environment variable must be specified.');
    console.error('   Please add ADMIN_PASSWORD to your server/.env before running this script.');
    process.exit(1);
  }

  if (password.length < 12) {
    console.error('❌ Security Violation: ADMIN_PASSWORD must be at least 12 characters long.');
    process.exit(1);
  }

  await connectDB();

  try {
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin && !isForce) {
      console.warn(`⚠️  An admin account already exists (${existingAdmin.email}).`);
      console.warn('   To overwrite or re-provision, run with --force flag:');
      console.warn('   node seed/createAdmin.js --force');
      process.exit(0);
    }

    if (existingAdmin && isForce) {
      existingAdmin.name = name;
      existingAdmin.email = email;
      existingAdmin.password = password; // Will be hashed by pre-save hook
      existingAdmin.role = 'admin';
      existingAdmin.isSuspended = false;
      await existingAdmin.save();
      console.log(`✅ Admin account updated successfully: ${email} (password hidden)`);
      process.exit(0);
    }

    // Check if user with that email already exists
    const userWithEmail = await User.findOne({ email });
    if (userWithEmail) {
      userWithEmail.role = 'admin';
      userWithEmail.name = name;
      userWithEmail.password = password;
      userWithEmail.isSuspended = false;
      await userWithEmail.save();
      console.log(`✅ Promoted existing user to admin: ${email} (password hidden)`);
      process.exit(0);
    }

    await User.create({
      name,
      email,
      password,
      role: 'admin',
      isSuspended: false,
    });

    console.log(`✅ Initial Admin successfully created: ${email} (password hidden)`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ Failed to create admin: ${err.message}`);
    process.exit(1);
  }
};

run();
