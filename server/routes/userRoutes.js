// routes/userRoutes.js
// Maps URL paths to controller functions for user-related actions.

import express from 'express';
import { toggleSaveProperty, getSavedProperties, updateProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All user routes are protected — must be logged in
router.post('/save/:propertyId', protect, toggleSaveProperty);  // POST /api/users/save/:propertyId
router.get('/saved', protect, getSavedProperties);              // GET  /api/users/saved
router.put('/profile', protect, updateProfile);                 // PUT  /api/users/profile

export default router;
