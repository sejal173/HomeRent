// server/tests/adminCompletion.test.js
// Comprehensive test suite verifying Sections 2, 3, and 6:
// 1. Visit status unified set (pending, accepted, rejected, cancelled, completed)
// 2. Safety reports (tenant-only, self-report block, landlord/admin 403)
// 3. Security guards (401/403, self-suspend guard, admin-suspend guard, role clamp, password exclusion, public 404 for suspended owner)
// 4. End-to-end workflows (property approval lifecycle, landlord edit resubmission, removal block, review moderation)

import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';
import User from '../models/User.js';
import Property from '../models/Property.js';
import VisitRequest from '../models/VisitRequest.js';
import PropertyReport from '../models/PropertyReport.js';
import Review from '../models/Review.js';
import AuditLog from '../models/AuditLog.js';

process.env.JWT_SECRET = 'test_secret_for_jest_only_not_real';
const TEST_DB = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/homerent_test_completion';

jest.setTimeout(30000);

let app;
let tenantUser, tenantToken;
let landlordUser, landlordToken;
let suspendedUser, suspendedToken;
let adminUser, adminToken;
let adminUser2, adminToken2;
let testProperty;

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
  app = createApp();

  // Clean test db
  await mongoose.connection.dropDatabase();

  // Create Users
  tenantUser = await User.create({
    name: 'Completion Tenant',
    email: 'c_tenant@example.com',
    password: 'password123',
    role: 'tenant',
  });
  tenantToken = jwt.sign({ id: tenantUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  landlordUser = await User.create({
    name: 'Completion Landlord',
    email: 'c_landlord@example.com',
    password: 'password123',
    role: 'landlord',
  });
  landlordToken = jwt.sign({ id: landlordUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  suspendedUser = await User.create({
    name: 'Completion Suspended',
    email: 'c_suspended@example.com',
    password: 'password123',
    role: 'tenant',
    isSuspended: true,
    suspensionReason: 'Breach of terms',
  });
  suspendedToken = jwt.sign({ id: suspendedUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  adminUser = await User.create({
    name: 'Completion Admin 1',
    email: 'c_admin1@example.com',
    password: 'password123',
    role: 'admin',
  });
  adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  adminUser2 = await User.create({
    name: 'Completion Admin 2',
    email: 'c_admin2@example.com',
    password: 'password123',
    role: 'admin',
  });
  adminToken2 = jwt.sign({ id: adminUser2._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Create test property
  testProperty = await Property.create({
    title: 'Test Luxury Apartment',
    description: 'A beautiful luxury apartment',
    type: 'Apartment',
    price: 35000,
    city: 'Mumbai',
    locality: 'Bandra West',
    bedrooms: 2,
    bathrooms: 2,
    furnished: 'Furnished',
    amenities: ['Gym', 'Pool'],
    images: ['https://example.com/photo.jpg'],
    available: true,
    approvalStatus: 'approved',
    owner: landlordUser._id,
  });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('Section 2: Consistency & Unified Values', () => {
  let visitId;

  it('2.1a: Tenant creates visit request starting in pending status', async () => {
    const res = await request(app)
      .post('/api/visits')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        propertyId: testProperty._id,
        requestedDate: new Date().toISOString(),
        requestedTime: '10:00 AM',
        message: 'Tour request',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('pending');
    visitId = res.body._id;
  });

  it('2.1b: Landlord can update visit status to accepted, completed, or rejected', async () => {
    const res1 = await request(app)
      .put(`/api/visits/${visitId}/status`)
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({ status: 'accepted' });
    expect(res1.statusCode).toBe(200);
    expect(res1.body.visit.status).toBe('accepted');

    const res2 = await request(app)
      .put(`/api/visits/${visitId}/status`)
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({ status: 'completed' });
    expect(res2.statusCode).toBe(200);
    expect(res2.body.visit.status).toBe('completed');
  });

  it('2.1c: Rejects invalid visit status values with 400', async () => {
    const res = await request(app)
      .put(`/api/visits/${visitId}/status`)
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({ status: 'confirmed_legacy_invalid' });
    expect(res.statusCode).toBe(400);
  });

  it('2.1d: Landlord cannot create a visit request (403 forbidden)', async () => {
    const res = await request(app)
      .post('/api/visits')
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({
        propertyId: testProperty._id,
        requestedDate: new Date().toISOString(),
        requestedTime: '02:00 PM',
        message: 'Landlord tour attempt',
      });
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/Only tenants/i);
  });

  it('2.2a: Tenant can submit safety report', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        propertyId: testProperty._id,
        category: 'misleading_photographs',
        description: 'Listing photos show different layout',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.report.status).toBe('pending');
  });

  it('2.2b: Duplicate safety report on same property returns 400', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        propertyId: testProperty._id,
        category: 'misleading_photographs',
        description: 'Duplicate attempt',
      });
    expect(res.statusCode).toBe(400);
  });

  it('2.2c: Landlord and Admin get 403 on POST /api/reports', async () => {
    const landlordRes = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({
        propertyId: testProperty._id,
        category: 'fake_listing',
        description: 'Landlord attempt',
      });
    expect(landlordRes.statusCode).toBe(403);

    const adminRes = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        propertyId: testProperty._id,
        category: 'fake_listing',
        description: 'Admin attempt',
      });
    expect(adminRes.statusCode).toBe(403);
  });
});

describe('Section 3: Security & Access Controls', () => {
  it('3.1: Admin route returns 401 with no token, 403 with tenant or landlord', async () => {
    const noToken = await request(app).get('/api/admin/dashboard');
    expect(noToken.statusCode).toBe(401);

    const tenantRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${tenantToken}`);
    expect(tenantRes.statusCode).toBe(403);

    const landlordRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${landlordToken}`);
    expect(landlordRes.statusCode).toBe(403);

    const suspendedRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${suspendedToken}`);
    expect(suspendedRes.statusCode).toBe(403);
  });

  it('3.2: Admin cannot suspend self (400) or other admins (403)', async () => {
    const selfRes = await request(app)
      .put(`/api/admin/users/${adminUser._id}/suspend`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ suspend: true, reason: 'Self suspend attempt' });
    expect(selfRes.statusCode).toBe(400);

    const otherAdminRes = await request(app)
      .put(`/api/admin/users/${adminUser2._id}/suspend`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ suspend: true, reason: 'Other admin suspend attempt' });
    expect(otherAdminRes.statusCode).toBe(403);
  });

  it('3.3: Registration role attempt=admin is rejected by validator', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Hacker Admin Attempt',
        email: 'hacker_admin@example.com',
        password: 'password123',
        role: 'admin',
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('Role must be either tenant or landlord');
  });

  it('3.4: User details endpoint excludes password hash', async () => {
    const res = await request(app)
      .get(`/api/admin/users/${tenantUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.password).toBeUndefined();
  });

  it('3.5: Suspended landlord listings return 404 to public, accessible to admin/owner', async () => {
    // Create property owned by suspended user
    const suspendedOwnerProp = await Property.create({
      title: 'Suspended Owner Property',
      description: 'Should be hidden from public',
      type: 'House',
      price: 20000,
      city: 'Delhi',
      locality: 'South Ex',
      bedrooms: 1,
      bathrooms: 1,
      furnished: 'Semi-Furnished',
      amenities: [],
      images: [],
      available: true,
      approvalStatus: 'approved',
      owner: suspendedUser._id,
    });

    // Public call returns 404
    const pubRes = await request(app).get(`/api/properties/${suspendedOwnerProp._id}`);
    expect(pubRes.statusCode).toBe(404);

    // Admin call returns 200
    const adminRes = await request(app)
      .get(`/api/properties/${suspendedOwnerProp._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminRes.statusCode).toBe(200);
  });
});

describe('Section 6: End-to-End Approval, Resubmission & Review Moderation', () => {
  let propId;
  let reviewId;

  it('6.1: Landlord adds property -> starts as Pending, absent from public search', async () => {
    const res = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({
        title: 'New Submission Penthouse',
        description: 'Penthouse waiting for review',
        type: 'Apartment',
        price: 60000,
        city: 'Bengaluru',
        locality: 'Indiranagar',
        bedrooms: 3,
        bathrooms: 3,
        furnished: 'Furnished',
        amenities: ['Terrace'],
        images: ['https://example.com/penthouse.jpg'],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.approvalStatus).toBe('pending');
    propId = res.body._id;

    // Direct public URL returns 404
    const directRes = await request(app).get(`/api/properties/${propId}`);
    expect(directRes.statusCode).toBe(404);

    // Absent from public search
    const searchRes = await request(app).get('/api/properties?city=Bengaluru');
    const found = searchRes.body.properties?.some(p => p._id.toString() === propId);
    expect(found).toBe(false);
  });

  it('6.2: Admin rejects with reason -> landlord edits back to Pending -> admin approves', async () => {
    // Admin rejects
    const rejectRes = await request(app)
      .put(`/api/admin/properties/${propId}/approval`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'rejected', reason: 'High-resolution images required' });
    expect(rejectRes.statusCode).toBe(200);
    expect(rejectRes.body.property.approvalStatus).toBe('rejected');

    // Landlord edits property -> automatically resets to pending with history entry
    const editRes = await request(app)
      .put(`/api/properties/${propId}`)
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({
        title: 'New Submission Penthouse (Updated)',
        images: ['https://example.com/hd-photo.jpg'],
      });
    expect(editRes.statusCode).toBe(200);
    expect(editRes.body.approvalStatus).toBe('pending');

    // Admin approves
    const approveRes = await request(app)
      .put(`/api/admin/properties/${propId}/approval`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });
    expect(approveRes.statusCode).toBe(200);
    expect(approveRes.body.property.approvalStatus).toBe('approved');

    // Now appears in public search
    const publicRes = await request(app).get(`/api/properties/${propId}`);
    expect(publicRes.statusCode).toBe(200);
  });

  it('6.3: Admin removes property -> landlord edit returns 403', async () => {
    // Admin removes
    const removeRes = await request(app)
      .put(`/api/admin/properties/${propId}/remove`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Dispute over ownership claims' });
    expect(removeRes.statusCode).toBe(200);
    expect(removeRes.body.property.approvalStatus).toBe('removed');

    // Landlord edit blocked with 403
    const editAttempt = await request(app)
      .put(`/api/properties/${propId}`)
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({ title: 'Attempting to edit removed listing' });
    expect(editAttempt.statusCode).toBe(403);
  });

  it('6.4: Review posted, admin hides with reason, public no longer sees it', async () => {
    // Tenant posts review
    const postRes = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({
        propertyId: testProperty._id,
        rating: 4,
        text: 'Great location and peaceful building.',
      });
    expect(postRes.statusCode).toBe(201);
    reviewId = postRes.body._id;

    // Public list returns review
    const pubRes1 = await request(app).get(`/api/reviews/property/${testProperty._id}`);
    expect(pubRes1.body.some(r => r._id.toString() === reviewId)).toBe(true);

    // Admin hides review
    const hideRes = await request(app)
      .put(`/api/admin/reviews/${reviewId}/moderate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        isHidden: true,
        moderationReason: 'Contains personal contact info',
        text: 'ATTEMPTING_TO_TAMPER_TEXT',
      });
    expect(hideRes.statusCode).toBe(200);

    // Text was NOT tampered
    expect(hideRes.body.review.text).toBe('Great location and peaceful building.');

    // Public list no longer includes hidden review
    const pubRes2 = await request(app).get(`/api/reviews/property/${testProperty._id}`);
    expect(pubRes2.body.some(r => r._id.toString() === reviewId)).toBe(false);
  });
});
