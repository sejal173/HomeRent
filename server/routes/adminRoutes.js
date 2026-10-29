// routes/adminRoutes.js
// Dedicated administrative endpoints strictly guarded by protect and adminOnly.

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';
import {
  getDashboardStats,
  getUsers,
  getUserByIdAdmin,
  toggleUserSuspension,
  getAdminProperties,
  getPropertyByIdAdmin,
  updatePropertyApproval,
  setPropertyAdminNote,
  softRemoveProperty,
  getReports,
  getReportByIdAdmin,
  updateReportStatus,
  getVerifications,
  getVerificationByIdAdmin,
  reviewVerification,
  getAdminVisitRequests,
  getAdminReviews,
  moderateReview,
  getAuditLogs,
} from '../controllers/adminController.js';

const router = express.Router();

// Apply protect and adminOnly to ALL admin routes
router.use(protect, adminOnly);

// 1. Dashboard metrics & aggregations
router.get('/dashboard', getDashboardStats);

// 2. User management
router.get('/users', getUsers);
router.get('/users/:id', getUserByIdAdmin);
router.put('/users/:id/suspend', toggleUserSuspension);

// 3. Property moderation & approval
router.get('/properties', getAdminProperties);
router.get('/properties/:id', getPropertyByIdAdmin);
router.put('/properties/:id/approval', updatePropertyApproval);
router.put('/properties/:id/note', setPropertyAdminNote);
router.put('/properties/:id/remove', softRemoveProperty);

// 4. Reports & Safety
router.get('/reports', getReports);
router.get('/reports/:id', getReportByIdAdmin);
router.put('/reports/:id', updateReportStatus);

// 5. Verification
router.get('/verifications', getVerifications);
router.get('/verifications/:id', getVerificationByIdAdmin);
router.put('/verifications/:id', reviewVerification);

// 6. Visit requests (read-only)
router.get('/visits', getAdminVisitRequests);

// 7. Reviews moderation
router.get('/reviews', getAdminReviews);
router.put('/reviews/:id/moderate', moderateReview);

// 8. Audit logs
router.get('/audit-logs', getAuditLogs);

export default router;
