// controllers/authController.js
// Handles user registration, login, and current profile retrieval.

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Helper: sign JWT token with process.env.JWT_SECRET (strictly no fallback)
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// ─────────────────────────────────────────────
// @route   POST /api/auth/register
// @desc    Register a new user (tenant or landlord only)
// @access  Public
// ─────────────────────────────────────────────
export const register = async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'User with this email already exists' });
  }

  // Security rule: Only 'tenant' or 'landlord' can be registered (cannot create admin)
  const allowedRole = role === 'landlord' ? 'landlord' : 'tenant';

  // Create new user (password hashed automatically by pre-save hook)
  const user = await User.create({
    name,
    email,
    password,
    role: allowedRole,
    phone: phone || '',
  });

  // Return user info without password
  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    token: generateToken(user._id),
  });
};

// ─────────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Authenticate user & return JWT token
// @access  Public
// ─────────────────────────────────────────────
export const login = async (req, res) => {
  const { email, password } = req.body;

  // Find user by email including hidden password field
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // Verify entered password against bcrypt hash
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // Block suspended users from logging in
  if (user.isSuspended) {
    return res.status(403).json({
      message: `Your account has been suspended: ${user.suspensionReason || 'Please contact support.'}`,
      isSuspended: true,
    });
  }

  // Return user info and token (password excluded)
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    token: generateToken(user._id),
  });
};

// ─────────────────────────────────────────────
// @route   GET /api/auth/me
// @desc    Get currently logged-in user profile
// @access  Private (JWT required)
// ─────────────────────────────────────────────
export const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).populate('savedProperties', 'title city price images');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
};
