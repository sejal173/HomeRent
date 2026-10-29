// controllers/reportController.js
// Handles tenant safety reports for listing anomalies and suspicious content.

import mongoose from 'mongoose';
import PropertyReport from '../models/PropertyReport.js';
import Property from '../models/Property.js';

// ─────────────────────────────────────────────
// @route   POST /api/reports
// @desc    Submit a safety warning / anomaly report on a property
// @access  Private (Tenants only)
// ─────────────────────────────────────────────
export const createReport = async (req, res) => {
  // Rule 2.2: Tenants only; landlords and admins get 403
  if (req.user?.role !== 'tenant') {
    return res.status(403).json({ message: 'Only tenant accounts are authorized to submit listing safety reports.' });
  }

  const { propertyId, category, description } = req.body;

  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    return res.status(400).json({ message: 'Invalid property ID' });
  }

  const validCategories = [
    'fake_listing',
    'duplicate_listing',
    'incorrect_information',
    'suspicious_payment_request',
    'misleading_photographs',
    'other',
  ];

  if (!category || !validCategories.includes(category)) {
    return res.status(400).json({
      message: 'Please select a valid report category from the supported options.',
    });
  }

  if (!description || !description.trim()) {
    return res.status(400).json({ message: 'Please describe the observation or warning signals.' });
  }

  const property = await Property.findById(propertyId);
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }

  // Prevent users from reporting their own listings
  if (property.owner.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot report your own listing.' });
  }

  // Check for existing report by same user on same property
  const existingReport = await PropertyReport.findOne({ property: propertyId, reportedBy: req.user._id });
  if (existingReport) {
    return res.status(400).json({ message: 'You have already submitted a report for this property listing.' });
  }

  const report = await PropertyReport.create({
    property: propertyId,
    reportedBy: req.user._id,
    category,
    description: description.trim(),
    status: 'pending',
  });

  res.status(201).json({
    message: 'Report submitted successfully. Our safety team will review the listing signals.',
    report,
  });
};
