// routes/authRoutes.js
// Authentication endpoints with rate-limiting and express-validator input validation.

import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRegister, validateLogin } from '../middleware/validatorMiddleware.js';

const router = express.Router();

// Rate limiter: prevents brute force password guessing attacks on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 50,                   // Limit each IP to 50 requests per window
  message: { message: 'Too many authentication attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, validateRegister, register); // POST /api/auth/register
router.post('/login', authLimiter, validateLogin, login);          // POST /api/auth/login
router.get('/me', protect, getMe);                                 // GET  /api/auth/me (protected)

export default router;
