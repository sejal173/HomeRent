// routes/propertyRoutes.js
// Maps URL paths to controller functions for properties.

import express from 'express';
import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getMyListings,
} from '../controllers/propertyController.js';
import { protect, landlordOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes — anyone can view properties
router.get('/', getProperties);           // GET /api/properties
router.get('/my-listings', protect, landlordOnly, getMyListings); // GET /api/properties/my-listings
router.get('/:id', getPropertyById);      // GET /api/properties/:id

// Protected routes — must be logged in as a landlord
router.post('/', protect, landlordOnly, createProperty);        // POST /api/properties
router.put('/:id', protect, updateProperty);                    // PUT  /api/properties/:id
router.delete('/:id', protect, deleteProperty);                 // DELETE /api/properties/:id

export default router;
