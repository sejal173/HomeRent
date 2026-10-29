// seed/migrateApprovalStatus.js
// Safe, idempotent migration script to initialize approvalStatus for legacy property listings.
// Zero deletes. Only updates properties where approvalStatus is missing or null.
//
// Usage: node seed/migrateApprovalStatus.js [--confirm]

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Property from '../models/Property.js';
import connectDB from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
  override: true,
});

const isConfirmed = process.argv.includes('--confirm');

const run = async () => {
  await connectDB();

  try {
    const filter = {
      $or: [
        { approvalStatus: { $exists: false } },
        { approvalStatus: null },
      ],
    };

    const count = await Property.countDocuments(filter);
    console.log(`📊 Found ${count} legacy properties requiring approvalStatus initialization.`);

    if (count === 0) {
      console.log('✅ All property listings already have approvalStatus. Nothing to migrate.');
      process.exit(0);
    }

    if (!isConfirmed) {
      console.log('⚠️  Confirmation required: to apply migration, run with the --confirm flag:');
      console.log('   node seed/migrateApprovalStatus.js --confirm');
      process.exit(0);
    }

    const result = await Property.updateMany(filter, {
      $set: {
        approvalStatus: 'approved',
        reviewedAt: new Date(),
        approvalHistory: [
          {
            status: 'approved',
            reason: 'Grandfathered approval: legacy listing migration',
            date: new Date(),
          },
        ],
      },
    });

    console.log(`✅ Migration complete! Updated ${result.modifiedCount} properties to 'approved'.`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ Migration failed: ${err.message}`);
    process.exit(1);
  }
};

run();
