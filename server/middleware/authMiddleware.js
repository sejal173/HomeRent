// middleware/authMiddleware.js
// Verifies JWT token on protected routes and attaches the authenticated user.

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // JWT is sent in the Authorization header as: "Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
      }

      // Verify the token using the secret key from process.env (no fallback)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach the user to the request object without password
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User belonging to this token no longer exists' });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// Landlord-only route guard
export const landlordOnly = (req, res, next) => {
  if (req.user && req.user.role === 'landlord') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Landlords only.' });
};
