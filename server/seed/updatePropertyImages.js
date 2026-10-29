// seed/updatePropertyImages.js
// Safe migration script to update existing properties in MongoDB with type-matching images.
// NEVER deletes any data. Only updates the "images" field of existing properties.
//
// Usage: node seed/updatePropertyImages.js --confirm

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

if (!process.argv.includes('--confirm')) {
  console.error('\n⚠️  SAFETY GUARD: updatePropertyImages.js updates the images for all properties in the database.');
  console.error('   No documents will be deleted. Only the "images" field of existing properties will be updated.');
  console.error('   To proceed, you must pass the --confirm flag:');
  console.error('   node seed/updatePropertyImages.js --confirm\n');
  process.exit(1);
}

const imagesByType = {
  Apartment: [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
    'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800',
    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800',
  ],
  Villa: [
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    'https://images.unsplash.com/photo-1605276373954-0c4a0dac5b12?w=800',
  ],
  House: [
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
    'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800',
    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
    'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
  ],
  Studio: [
    'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800',
    'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
    'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?w=800',
    'https://images.unsplash.com/photo-1598928636135-d146006ff4be?w=800',
    'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800',
  ],
  PG: [
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
    'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
    'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800',
    'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800',
  ],
};

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getTwoImages = (type) => {
  const pool = imagesByType[type] || imagesByType.Apartment;
  const img1 = randomItem(pool);
  const remaining = pool.filter((img) => img !== img1);
  const img2 = remaining.length > 0 ? randomItem(remaining) : img1;
  return [img1, img2];
};

const updateImages = async () => {
  await connectDB();

  try {
    const properties = await Property.find({}, '_id type title images');
    console.log(`📊 Found ${properties.length} properties in database.`);

    if (properties.length === 0) {
      console.log('ℹ️  No properties found to update.');
      process.exit(0);
    }

    const bulkOps = properties.map((prop) => {
      const updatedImages = getTwoImages(prop.type);
      return {
        updateOne: {
          filter: { _id: prop._id },
          update: { $set: { images: updatedImages } },
        },
      };
    });

    const result = await Property.bulkWrite(bulkOps);
    console.log(`✅ Successfully updated images for ${result.modifiedCount} properties!`);
    console.log('🔒 Zero documents deleted. All other property fields preserved intact.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to update property images:', error.message);
    process.exit(1);
  }
};

updateImages();

