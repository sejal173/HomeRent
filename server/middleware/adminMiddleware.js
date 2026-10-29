// middleware/adminMiddleware.js
// Route guard that permits access strictly to users with the 'admin' role.

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Administrators only.' });
};
