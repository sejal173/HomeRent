// routes/userRoutes.js
// User routes for bookmarks and profile management with input validation.

import express from 'express';
import { toggleSaveProperty, getSavedProperties, updateProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateUpdateProfile } from '../middleware/validatorMiddleware.js';

const router = express.Router();

// All user routes are protected — must be logged in
router.post('/save/:propertyId', protect, toggleSaveProperty);              // POST /api/users/save/:propertyId
router.get('/saved', protect, getSavedProperties);                          // GET  /api/users/saved
router.put('/profile', protect, validateUpdateProfile, updateProfile);       // PUT  /api/users/profile

export default router;
