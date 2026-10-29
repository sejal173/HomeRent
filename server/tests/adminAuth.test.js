// server/tests/adminAuth.test.js
// Integration tests verifying admin route authorization rules:
// - No token: 401
// - Tenant: 403
// - Landlord: 403
// - Suspended user: 403
// - Admin: 200

import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import User from '../models/User.js';

process.env.JWT_SECRET = 'test_secret_for_jest_only_not_real';
process.env.MONGO_URI_TEST = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/homerent_test_admin';

const TEST_DB = process.env.MONGO_URI_TEST;

let app;
let tenantToken;
let landlordToken;
let suspendedToken;
let adminToken;

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
  app = createApp();

  // Create test tenant
  const tenant = await User.create({
    name: 'Test Tenant',
    email: 'tenant_test@example.com',
    password: 'password123',
    role: 'tenant',
  });
  tenantToken = jwt.sign({ id: tenant._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Create test landlord
  const landlord = await User.create({
    name: 'Test Landlord',
    email: 'landlord_test@example.com',
    password: 'password123',
    role: 'landlord',
  });
  landlordToken = jwt.sign({ id: landlord._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Create test suspended admin
  const suspendedAdmin = await User.create({
    name: 'Suspended Admin',
    email: 'suspended_admin@example.com',
    password: 'password123',
    role: 'admin',
    isSuspended: true,
    suspensionReason: 'Test suspension',
  });
  suspendedToken = jwt.sign({ id: suspendedAdmin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Create active admin
  const admin = await User.create({
    name: 'Active Admin',
    email: 'active_admin@example.com',
    password: 'password123',
    role: 'admin',
    isSuspended: false,
  });
  adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

test('1. GET /api/admin/dashboard without token returns 401', async () => {
  const res = await request(app).get('/api/admin/dashboard');
  expect(res.statusCode).toBe(401);
});

test('2. GET /api/admin/dashboard with tenant token returns 403', async () => {
  const res = await request(app)
    .get('/api/admin/dashboard')
    .set('Authorization', `Bearer ${tenantToken}`);
  expect(res.statusCode).toBe(403);
});

test('3. GET /api/admin/dashboard with landlord token returns 403', async () => {
  const res = await request(app)
    .get('/api/admin/dashboard')
    .set('Authorization', `Bearer ${landlordToken}`);
  expect(res.statusCode).toBe(403);
});

test('4. GET /api/admin/dashboard with suspended user token returns 403', async () => {
  const res = await request(app)
    .get('/api/admin/dashboard')
    .set('Authorization', `Bearer ${suspendedToken}`);
  expect(res.statusCode).toBe(403);
  expect(res.body.message).toContain('suspended');
});

test('5. GET /api/admin/dashboard with active admin token returns 200 and metrics', async () => {
  const res = await request(app)
    .get('/api/admin/dashboard')
    .set('Authorization', `Bearer ${adminToken}`);
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('metrics');
  expect(res.body).toHaveProperty('trends');
  expect(res.body).toHaveProperty('distributions');
});
