// routes/reviewRoutes.js
// Property reviews and ratings endpoints.

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createReview, getPropertyReviews } from '../controllers/reviewController.js';

const router = express.Router();

router.post('/', protect, createReview);
router.get('/property/:propertyId', getPropertyReviews);

export default router;
