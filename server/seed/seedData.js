// seed/seedData.js
// ⚠️  CRITICAL WARNING: Re-running this script will delete all properties and non-admin users!
//     To prevent accidental data loss, this script REQUIRES the --confirm flag:
//     Command: node seed/seedData.js --confirm
//
//     The administrator account (role: 'admin') is strictly preserved and will NEVER be deleted.

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Property from '../models/Property.js';

dotenv.config();

if (!process.argv.includes('--confirm')) {
  console.error('\n⚠️  SAFETY GUARD: Re-running seedData.js will clear non-admin users and all properties!');
  console.error('   Existing administrator accounts (role: admin) are protected, but all listings will be reset.');
  console.error('   To proceed, you must pass the --confirm flag:');
  console.error('   node seed/seedData.js --confirm\n');
  process.exit(1);
}

// ── Test Data ────────────────────────────────────────────────────────────────

const cities = ['Pune', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Delhi NCR'];
const localities = {
  Pune: ['Hinjawadi', 'Kothrud', 'Baner', 'Viman Nagar', 'Wakad', 'Aundh'],
  Mumbai: ['Andheri', 'Bandra', 'Powai', 'Thane', 'Navi Mumbai', 'Borivali'],
  Bengaluru: ['Koramangala', 'Indiranagar', 'HSR Layout', 'Whitefield', 'Electronic City'],
  Hyderabad: ['Gachibowli', 'Madhapur', 'Hitech City', 'Kondapur', 'Banjara Hills'],
  'Delhi NCR': ['Noida Sector 62', 'Gurgaon', 'Dwarka', 'Rohini', 'Vasant Kunj'],
};
const types = ['Apartment', 'Villa', 'House', 'Studio', 'PG'];
const furnished = ['Furnished', 'Semi-Furnished', 'Unfurnished'];
const amenitiesList = ['Parking', 'Gym', 'Pool', 'Security', 'Power Backup', 'Lift', 'Garden', 'Club House'];

// Placeholder property images grouped by property type (using Unsplash for demo)
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
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomAmenities = () => amenitiesList.filter(() => Math.random() > 0.5);

// ── Generate Users ───────────────────────────────────────────────────────────

const generateUsers = async () => {
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = [];

  // 5 landlords
  const landlordNames = ['Rahul Sharma', 'Priya Mehta', 'Amit Patel', 'Sunita Rao', 'Vikram Joshi'];
  for (let i = 0; i < 5; i++) {
    users.push({
      name: landlordNames[i],
      email: `landlord${i + 1}@homerent.dev`,
      password: hashedPassword,
      role: 'landlord',
      phone: `+91 9${randomInt(100000000, 999999999)}`,
    });
  }

  // 100 tenants
  const firstNames = ['Arun', 'Sneha', 'Kiran', 'Pooja', 'Rohit', 'Neha', 'Sanjay', 'Anita', 'Deepak', 'Kavya'];
  const lastNames = ['Kumar', 'Singh', 'Gupta', 'Sharma', 'Verma', 'Nair', 'Iyer', 'Das', 'Reddy', 'Pillai'];
  for (let i = 0; i < 100; i++) {
    users.push({
      name: `${randomItem(firstNames)} ${randomItem(lastNames)}`,
      email: `tenant${i + 1}@homerent.dev`,
      password: hashedPassword,
      role: 'tenant',
      phone: `+91 8${randomInt(100000000, 999999999)}`,
    });
  }

  return users;
};

// ── Generate Properties ──────────────────────────────────────────────────────

const generateProperties = (landlordIds) => {
  const properties = [];
  const titles = [
    'Spacious {type} in {locality}',
    'Modern {type} near Metro Station',
    'Affordable {type} for Families',
    'Luxury {type} with City View',
    'Cozy {type} with Great Amenities',
    'Well-Connected {type} in Prime Location',
    'Budget-Friendly {type} for Working Professionals',
    'Newly Built {type} with Parking',
  ];

  for (let i = 0; i < 100; i++) {
    const city = randomItem(cities);
    const locality = randomItem(localities[city]);
    const type = randomItem(types);
    const bedrooms = type === 'Studio' || type === 'PG' ? 1 : randomInt(1, 4);
    const priceBase = { Studio: 8000, PG: 6000, Apartment: 15000, House: 20000, Villa: 35000 };
    const price = priceBase[type] + randomInt(0, 15000);

    const titleTemplate = randomItem(titles);
    const title = titleTemplate.replace('{type}', type).replace('{locality}', locality);

    properties.push({
      title,
      description: `This is a beautiful ${type} located in ${locality}, ${city}. It offers a comfortable living experience with modern amenities. Ideal for families and working professionals. Close to markets, hospitals, and public transport.`,
      type,
      price,
      city,
      locality,
      bedrooms,
      bathrooms: bedrooms === 1 ? 1 : randomInt(1, bedrooms),
      furnished: randomItem(furnished),
      amenities: randomAmenities(),
      images: [
        randomItem(imagesByType[type] || imagesByType.Apartment),
        randomItem(imagesByType[type] || imagesByType.Apartment),
      ],
      available: Math.random() > 0.1, // 90% are available
      approvalStatus: 'approved',
      owner: randomItem(landlordIds),
    });
  }

  return properties;
};

// ── Main Seed Function ───────────────────────────────────────────────────────

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (preserves administrator account)
    console.log('🗑️  Clearing old non-admin data...');
    await User.deleteMany({ role: { $ne: 'admin' } });
    await Property.deleteMany({});

    // Insert users
    console.log('👥 Creating 105 users (5 landlords + 100 tenants)...');
    const usersData = await generateUsers();
    const insertedUsers = await User.insertMany(usersData);

    // Get landlord IDs
    const landlordIds = insertedUsers
      .filter((u) => u.role === 'landlord')
      .map((u) => u._id);

    // Insert properties
    console.log('🏠 Creating 100 property listings...');
    const propertiesData = generateProperties(landlordIds);
    await Property.insertMany(propertiesData);

    console.log('');
    console.log('✅ Database seeded successfully!');
    console.log('──────────────────────────────────────');
    console.log('📧 Landlord login: landlord1@homerent.dev / password123');
    console.log('📧 Tenant login:   tenant1@homerent.dev  / password123');
    console.log('──────────────────────────────────────');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedDatabase();
