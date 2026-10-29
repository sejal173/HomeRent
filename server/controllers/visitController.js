// controllers/visitController.js
// Handles tenant tour/visit requests and landlord scheduling responses.

import mongoose from 'mongoose';
import VisitRequest from '../models/VisitRequest.js';
import Property from '../models/Property.js';
import { sendVisitConfirmed } from '../utils/emailService.js';

// ─────────────────────────────────────────────
// @route   POST /api/visits
// @desc    Submit a new visit / inquiry request
// @access  Private (Tenants only)
// ─────────────────────────────────────────────
export const createVisitRequest = async (req, res) => {
  const { propertyId, requestedDate, requestedTime, message, tenantName, tenantPhone } = req.body;

  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    return res.status(400).json({ message: 'Invalid property ID' });
  }

  const property = await Property.findById(propertyId);
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }

  // Restrict booking to tenants only
  if (req.user.role !== 'tenant') {
    return res.status(403).json({ message: 'Only tenants can schedule property visits' });
  }

  // Prevent requesting a visit on one's own property
  if (property.owner.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot request a site visit for your own property listing.' });
  }

  if (!requestedDate) {
    return res.status(400).json({ message: 'Requested move-in / visit date is required' });
  }

  const visit = await VisitRequest.create({
    property: property._id,
    tenant: req.user._id,
    owner: property.owner,
    requestedDate: new Date(requestedDate),
    requestedTime: requestedTime || '',
    message: message || '',
    tenantName: tenantName || req.user.name,
    tenantPhone: tenantPhone || req.user.phone || '',
    status: 'pending',
  });

  const populated = await VisitRequest.findById(visit._id)
    .populate('property', 'title city locality price')
    .populate('owner', 'name email phone');

  res.status(201).json(populated);
};

// ─────────────────────────────────────────────
// @route   GET /api/visits/my-visits
// @desc    Get all visit requests submitted by logged-in tenant
// @access  Private
// ─────────────────────────────────────────────
export const getMyVisits = async (req, res) => {
  const visits = await VisitRequest.find({ tenant: req.user._id })
    .populate('property', 'title city locality price images')
    .populate('owner', 'name email phone')
    .sort({ createdAt: -1 });

  res.json(visits);
};

// ─────────────────────────────────────────────
// @route   GET /api/visits/owner
// @desc    Get all visit requests received by logged-in landlord
// @access  Private (Landlords only)
// ─────────────────────────────────────────────
export const getOwnerVisits = async (req, res) => {
  const visits = await VisitRequest.find({ owner: req.user._id })
    .populate('property', 'title city locality price images')
    .populate('tenant', 'name email phone')
    .sort({ createdAt: -1 });

  res.json(visits);
};

// ─────────────────────────────────────────────
// @route   PUT /api/visits/:id/status
// @desc    Update visit request status (accepted, rejected, cancelled, completed)
// @access  Private (Owner or Tenant)
// ─────────────────────────────────────────────
export const updateVisitStatus = async (req, res) => {
  const { status } = req.body;
  const visitId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(visitId)) {
    return res.status(400).json({ message: 'Invalid visit request ID' });
  }

  if (!['pending', 'accepted', 'rejected', 'cancelled', 'completed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value. Must be pending, accepted, rejected, cancelled, or completed.' });
  }

  const visit = await VisitRequest.findById(visitId);
  if (!visit) {
    return res.status(404).json({ message: 'Visit request not found' });
  }

  // Authorization: Only owner or tenant can update
  const isOwner = visit.owner.toString() === req.user._id.toString();
  const isTenant = visit.tenant.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isTenant && !isAdmin) {
    return res.status(403).json({ message: 'Not authorized to update this visit request' });
  }

  // Tenant can only cancel
  if (isTenant && !isOwner && !isAdmin && status !== 'cancelled') {
    return res.status(403).json({ message: 'Tenants may only cancel their visit requests' });
  }

  visit.status = status;
  await visit.save();

  if (status === 'accepted') sendVisitConfirmed(visit.tenant, visit.tenantName, visit.property, visit.requestedDate, visit.requestedTime, req.user?.phone);

  res.json({ message: `Visit request marked as ${status}`, visit });
};
