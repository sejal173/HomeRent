// middleware/authMiddleware.js
// Middleware runs BEFORE the controller code.
// This middleware checks if the incoming request has a valid JWT token.
// If valid → the request continues. If not → we send a 401 error.

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // JWT is sent in the Authorization header as: "Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract just the token part (remove "Bearer ")
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using our secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach the user to the request (without the password)
      req.user = await User.findById(decoded.id).select('-password');

      next(); // Token is valid — continue to the controller
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// Extra middleware: only landlords can access certain routes
export const landlordOnly = (req, res, next) => {
  if (req.user && req.user.role === 'landlord') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Landlords only.' });
  }
};
