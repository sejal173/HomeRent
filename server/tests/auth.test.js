// server/tests/auth.test.js
// 4 integration tests using a separate test database (homerent_test).
// The main homerent database is never touched by tests.

import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../app.js';

// Set JWT_SECRET before importing anything that uses it
process.env.JWT_SECRET = 'test_secret_for_jest_only_not_real';
process.env.MONGO_URI_TEST = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/homerent_test';

const TEST_DB = process.env.MONGO_URI_TEST;

let app;

// Before all tests: connect to test DB and register a test user
beforeAll(async () => {
  await mongoose.connect(TEST_DB);
  app = createApp();

  // Register a landlord so we can test login
  await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'landlord',
    });
});

// After all tests: drop test DB and close connection
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

// ── Test 1: Successful login ─────────────────────────────────────────────────
test('Login with correct credentials returns 200 and a token', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'test@example.com', password: 'password123' });

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('token');
  expect(res.body.email).toBe('test@example.com');
});

// ── Test 2: Wrong password ───────────────────────────────────────────────────
test('Login with wrong password returns 401', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'test@example.com', password: 'wrongpassword' });

  expect(res.statusCode).toBe(401);
  expect(res.body).toHaveProperty('message');
});

// ── Test 3: List properties (public route) ───────────────────────────────────
test('GET /api/properties returns 200 with properties array', async () => {
  const res = await request(app).get('/api/properties');

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('properties');
  expect(Array.isArray(res.body.properties)).toBe(true);
});

// ── Test 4: Create property without token returns 401 ────────────────────────
test('POST /api/properties without token returns 401', async () => {
  const res = await request(app)
    .post('/api/properties')
    .send({
      title: 'Test Property',
      description: 'A test property',
      type: 'Apartment',
      price: 15000,
      city: 'Pune',
      locality: 'Kothrud',
      bedrooms: 2,
      bathrooms: 1,
    });

  expect(res.statusCode).toBe(401);
});
