import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
  override: true,
});

import connectDB from '../config/db.js';
import User from '../models/User.js';

async function changeAdminPassword() {
  await connectDB();

  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const newPassword = process.env.NEW_ADMIN_PASSWORD;

  if (!email) {
    console.error('❌ Error: ADMIN_EMAIL environment variable must be specified.');
    process.exit(1);
  }

  if (!newPassword || newPassword.length < 12) {
    console.error('❌ Error: NEW_ADMIN_PASSWORD environment variable is required and must be at least 12 characters.');
    process.exit(1);
  }

  const admin = await User.findOne({ email, role: 'admin' });
  if (!admin) {
    console.error(`❌ Error: Admin account with email "${email}" not found.`);
    process.exit(1);
  }

  admin.password = newPassword;
  await admin.save(); // User pre-save hook will hash with bcrypt (salt 10)

  console.log(`✅ Admin password successfully updated for "${email}".`);
  process.exit(0);
}

changeAdminPassword().catch((err) => {
  console.error('❌ Error updating admin password:', err.message);
  process.exit(1);
});
