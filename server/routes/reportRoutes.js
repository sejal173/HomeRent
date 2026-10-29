// routes/reportRoutes.js
// Tenant property safety reporting endpoints with rate limiting.

import express from 'express';
import rateLimit from 'express-rate-limit';
import { protect } from '../middleware/authMiddleware.js';
import { createReport } from '../controllers/reportController.js';

const router = express.Router();

// Rate limiter: prevents report spamming
const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 15,                  // Limit each IP to 15 reports per 15 minutes
  message: { message: 'Too many safety reports submitted from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', protect, reportLimiter, createReport);

export default router;
