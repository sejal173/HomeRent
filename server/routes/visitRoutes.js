// routes/visitRoutes.js
// Tenant tour & visit request endpoints.

import express from 'express';
import { protect, landlordOnly } from '../middleware/authMiddleware.js';
import {
  createVisitRequest,
  getMyVisits,
  getOwnerVisits,
  updateVisitStatus,
} from '../controllers/visitController.js';

const router = express.Router();

router.post('/', protect, createVisitRequest);
router.get('/my-visits', protect, getMyVisits);
router.get('/owner', protect, landlordOnly, getOwnerVisits);
router.put('/:id/status', protect, updateVisitStatus);

export default router;
