// routes/verificationRoutes.js
// Property-level verification document submission and secure retrieval endpoints.

import express from 'express';
import { protect, landlordOnly } from '../middleware/authMiddleware.js';
import {
  uploadVerificationDocs,
  submitVerification,
  getPropertyVerification,
  serveDocument,
} from '../controllers/verificationController.js';

const router = express.Router();

// Landlord submit / resubmit verification documents
router.post('/submit', protect, landlordOnly, (req, res, next) => {
  uploadVerificationDocs(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Error uploading document files' });
    }
    next();
  });
}, submitVerification);

// View status of verification for a property
router.get('/property/:propertyId', protect, getPropertyVerification);

// Secure document viewing/downloading (authenticated owner or admin only)
router.get('/documents/:filename', protect, serveDocument);

export default router;
