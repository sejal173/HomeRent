// controllers/verificationController.js
// Handles property-level landlord ownership & deed verification document uploads and secure access.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import mongoose from 'mongoose';
import VerificationSubmission from '../models/VerificationSubmission.js';
import Property from '../models/Property.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Private non-public uploads directory outside any static assets route
const uploadDir = path.resolve(__dirname, '../uploads/verifications');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

import crypto from 'crypto';

// Multer storage engine with cryptographically random filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const randomHash = crypto.randomBytes(16).toString('hex');
    cb(null, `doc-${Date.now()}-${randomHash}${ext}`);
  },
});

// File filter: strict validation of BOTH MIME type AND file extension (PDF, JPG, PNG only)
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png'];
  const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];

  if (allowedExts.includes(ext) && allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only PDF, JPG, and PNG documents are accepted.'), false);
  }
};

export const uploadVerificationDocs = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max per file
}).array('documents', 5); // Max 5 files per submission

// ─────────────────────────────────────────────
// @route   POST /api/verifications/submit
// @desc    Upload documents and submit property for verification (Landlord only)
// @access  Private
// ─────────────────────────────────────────────
export const submitVerification = async (req, res) => {
  const { propertyId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    return res.status(400).json({ message: 'Invalid property ID' });
  }

  const property = await Property.findById(propertyId);
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }

  // Verify ownership
  if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only the property owner can submit verification documents.' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'At least one document file is required.' });
  }

  const uploadedDocs = req.files.map((file) => ({
    originalName: file.originalname,
    filename: file.filename,
    path: file.path,
    mimeType: file.mimetype,
    size: file.size,
    uploadedAt: new Date(),
  }));

  // Check if existing verification submission exists
  let submission = await VerificationSubmission.findOne({ property: propertyId });

  if (submission) {
    if (submission.status === 'pending') {
      return res.status(400).json({ message: 'A verification submission for this property is already pending review.' });
    }

    if (submission.status === 'approved') {
      return res.status(400).json({ message: 'This property has already been verified.' });
    }

    // Resubmission after rejection
    submission.documents = uploadedDocs;
    submission.status = 'pending';
    submission.rejectionReason = '';
    submission.resubmissionCount += 1;
    submission.reviewedBy = null;
    submission.reviewedAt = null;
    await submission.save();

    return res.json({
      message: 'Verification documents resubmitted successfully for review.',
      submission,
    });
  }

  // Create new submission
  submission = await VerificationSubmission.create({
    property: propertyId,
    owner: req.user._id,
    documents: uploadedDocs,
    status: 'pending',
  });

  res.status(201).json({
    message: 'Verification documents uploaded and submitted successfully.',
    submission,
  });
};

// ─────────────────────────────────────────────
// @route   GET /api/verifications/property/:propertyId
// @desc    Get verification submission status for a property
// @access  Private
// ─────────────────────────────────────────────
export const getPropertyVerification = async (req, res) => {
  const { propertyId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    return res.status(400).json({ message: 'Invalid property ID' });
  }

  const submission = await VerificationSubmission.findOne({ property: propertyId })
    .populate('property', 'title city locality')
    .populate('reviewedBy', 'name');

  if (!submission) {
    return res.json({ status: 'unsubmitted', message: 'No verification submission found for this property.' });
  }

  // Only owner or admin can view
  if (submission.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to view this verification submission' });
  }

  res.json(submission);
};

// ─────────────────────────────────────────────
// @route   GET /api/verifications/documents/:filename
// @desc    Securely download/stream a verification document (authenticated owner or admin only)
// @access  Private
// ─────────────────────────────────────────────
export const serveDocument = async (req, res) => {
  const { filename } = req.params;

  // Sanitize filename to prevent directory traversal
  const safeFilename = path.basename(filename);
  const filePath = path.join(uploadDir, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Document file not found' });
  }

  // Find the verification submission containing this document
  const submission = await VerificationSubmission.findOne({ 'documents.filename': safeFilename });
  if (!submission) {
    return res.status(404).json({ message: 'Document record not found' });
  }

  // Rule 11: Serve only via an authenticated endpoint (owner of the property or admin)
  const isOwner = submission.owner.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: 'Access denied. You do not have permission to view this document.' });
  }

  res.sendFile(filePath);
};
