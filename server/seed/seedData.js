// seed/seedData.js
// This script fills the database with 10 test users (landlords + tenants)
// and 100 test property listings.
//
// ⚠️  IMPORTANT: Run this ONLY ONCE after setting up your database.
//     Command: node seed/seedData.js
//
// It will DELETE existing users and properties first, then insert fresh test data.

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Property from '../models/Property.js';

dotenv.config();

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

// Placeholder property images (using Unsplash for demo)
const images = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
];

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
      images: [randomItem(images), randomItem(images)],
      available: Math.random() > 0.1, // 90% are available
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

    // Clear existing data
    console.log('🗑️  Clearing old data...');
    await User.deleteMany({});
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
