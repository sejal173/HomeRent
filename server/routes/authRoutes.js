// routes/authRoutes.js
// Authentication endpoints with rate-limiting and express-validator input validation.

import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRegister, validateLogin } from '../middleware/validatorMiddleware.js';

const router = express.Router();

// Rate limiter for authentication: prevents brute-force password attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 login attempts per 15-minute window
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test', // Bypass in test environments
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { message: 'Too many authentication attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});

router.post('/register', authLimiter, validateRegister, register); // POST /api/auth/register
router.post('/login', loginLimiter, validateLogin, login);          // POST /api/auth/login
router.get('/me', protect, getMe);                                 // GET  /api/auth/me (protected)

export default router;
