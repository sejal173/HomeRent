// controllers/authController.js
// Controllers contain the actual logic for each API endpoint.
// Auth controller handles: register a new user, and login an existing user.

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Helper: create a JWT token for a user
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// ─────────────────────────────────────────────
// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public (anyone can call this)
// ─────────────────────────────────────────────
export const register = async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  // Check if all required fields are provided
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please fill in all required fields' });
  }

  // Check if user with this email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'User with this email already exists' });
  }

  // Create the new user (password is hashed automatically by the model's pre-save hook)
  const user = await User.create({ name, email, password, role, phone });

  // Send back the user info + a token so they are automatically logged in
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
// @desc    Login user and return JWT
// @access  Public
// ─────────────────────────────────────────────
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  // Find user by email — include password field (it's hidden by default)
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // Compare the entered password with the hashed password in the DB
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // Login successful — send user info + token
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
// @desc    Get currently logged-in user's profile
// @access  Private (requires JWT token)
// ─────────────────────────────────────────────
export const getMe = async (req, res) => {
  // req.user is set by the protect middleware
  const user = await User.findById(req.user._id).populate('savedProperties', 'title city price images');
  res.json(user);
};
