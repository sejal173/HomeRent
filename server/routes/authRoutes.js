// routes/authRoutes.js
// Maps URL paths to controller functions for authentication.
// router.post('/register') means: when someone calls POST /api/auth/register → run the register function

import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);  // POST /api/auth/register
router.post('/login', login);        // POST /api/auth/login
router.get('/me', protect, getMe);   // GET  /api/auth/me  (protected)

export default router;
