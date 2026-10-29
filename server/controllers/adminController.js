// controllers/adminController.js
// Handles administrative oversight: dashboard analytics, user moderation,
// property approval workflows, audit logging, and platform safety.

import mongoose from 'mongoose';
import User from '../models/User.js';
import Property from '../models/Property.js';
import AuditLog from '../models/AuditLog.js';
import PropertyReport from '../models/PropertyReport.js';
import VerificationSubmission from '../models/VerificationSubmission.js';
import VisitRequest from '../models/VisitRequest.js';
import Review from '../models/Review.js';

// Helper: record action to AuditLog
const logAudit = async ({ adminId, action, targetType, targetId, previousStatus = '', newStatus = '', reason = '', details = {}, ip = '' }) => {
  try {
    await AuditLog.create({
      admin: adminId,
      action,
      targetType,
      targetId,
      previousStatus,
      newStatus,
      reason,
      details,
      ipAddress: ip,
    });
  } catch (err) {
    console.error(`Failed to write audit log for action "${action}" on target "${targetId}":`, err.message);
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/admin/dashboard
// @desc    Retrieve all platform statistics, aggregations, and trends
// @access  Private (Admin only)
// ─────────────────────────────────────────────
export const getDashboardStats = async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Run core counts in parallel via real MongoDB queries
  const [
    totalUsers,
    totalLandlords,
    totalTenants,
    totalSuspendedUsers,
    totalProperties,
    pendingProperties,
    approvedProperties,
    rejectedProperties,
    removedProperties,
    pendingReports,
    pendingVerifications,
    totalVisitRequests,
    totalReviews,
    userRegistrationTrend,
    propertyListingTrend,
    typeDistribution,
    recentUsers,
    recentProperties,
    recentReports,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'landlord' }),
    User.countDocuments({ role: 'tenant' }),
    User.countDocuments({ isSuspended: true }),
    Property.countDocuments(),
    Property.countDocuments({ approvalStatus: 'pending' }),
    Property.countDocuments({ approvalStatus: { $in: ['approved', null] } }),
    Property.countDocuments({ approvalStatus: 'rejected' }),
    Property.countDocuments({ approvalStatus: 'removed' }),
    PropertyReport.countDocuments({ status: 'pending' }),
    VerificationSubmission.countDocuments({ status: 'pending' }),
    VisitRequest.countDocuments(),
    Review.countDocuments(),

    // User registrations by day (last 30 days)
    User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Property listings by day (last 30 days)
    Property.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Properties by type
    Property.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]),

    // Recent 5 users
    User.find().select('name email role isSuspended isVerified createdAt').sort({ createdAt: -1 }).limit(5),

    // Recent 5 properties
    Property.find().select('title city price type approvalStatus available createdAt').populate('owner', 'name email').sort({ createdAt: -1 }).limit(5),

    // Recent 5 reports
    PropertyReport.find().populate('property', 'title city').populate('reportedBy', 'name email').sort({ createdAt: -1 }).limit(5),
  ]);

  res.json({
    metrics: {
      totalUsers,
      totalLandlords,
      totalTenants,
      totalSuspendedUsers,
      totalProperties,
      pendingProperties,
      approvedProperties,
      rejectedProperties,
      removedProperties,
      pendingReports,
      pendingVerifications,
      totalVisitRequests,
      totalReviews,
    },
    trends: {
      userRegistrations: userRegistrationTrend.map((d) => ({ date: d._id, count: d.count })),
      propertyListings: propertyListingTrend.map((d) => ({ date: d._id, count: d.count })),
    },
    distributions: {
      types: typeDistribution.map((t) => ({ type: t._id || 'Unspecified', count: t.count })),
      approvalStatus: [
        { status: 'Approved', count: approvedProperties },
        { status: 'Pending', count: pendingProperties },
        { status: 'Rejected', count: rejectedProperties },
        { status: 'Removed', count: removedProperties },
      ],
    },
    recentActivity: {
      users: recentUsers,
      properties: recentProperties,
      reports: recentReports,
    },
  });
};

// ─────────────────────────────────────────────
// @route   GET /api/admin/users
// @desc    List all users with filters, search, and pagination
// @access  Private (Admin only)
// ─────────────────────────────────────────────
export const getUsers = async (req, res) => {
  const { role, isSuspended, search, page = 1, limit = 10, sort = 'newest' } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (isSuspended !== undefined) filter.isSuspended = isSuspended === 'true';
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  let sortOption = { createdAt: -1 };
  if (sort === 'oldest') sortOption = { createdAt: 1 };
  if (sort === 'name') sortOption = { name: 1 };

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('name email role phone isSuspended suspensionReason isVerified createdAt')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  res.json({
    users,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
};

// ─────────────────────────────────────────────
// @route   PUT /api/admin/users/:id/suspend
// @desc    Toggle user account suspension with mandatory reason
// @access  Private (Admin only)
// ─────────────────────────────────────────────
export const toggleUserSuspension = async (req, res) => {
  const { suspend, reason } = req.body;
  const targetId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  if (typeof suspend !== 'boolean') {
    return res.status(400).json({ message: 'Field "suspend" (boolean) is required. Toggling is not permitted.' });
  }

  // Security guard 3: Admin cannot suspend themselves
  if (req.user._id.toString() === targetId.toString()) {
    return res.status(400).json({ message: 'Security rule: You cannot suspend your own admin account.' });
  }

  const targetUser = await User.findById(targetId);
  if (!targetUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Security guard 3: Admin cannot suspend another admin
  if (targetUser.role === 'admin') {
    return res.status(403).json({ message: 'Security rule: Administrators cannot suspend other administrators.' });
  }

  // Return 409 if user is already in requested state
  if (targetUser.isSuspended === suspend) {
    return res.status(409).json({ message: `User is already ${suspend ? 'suspended' : 'active'}.` });
  }

  // Suspension requires a non-empty reason
  if (suspend && (!reason || !reason.trim())) {
    return res.status(400).json({ message: 'A specific reason is required to suspend a user account.' });
  }

  const previousStatus = targetUser.isSuspended ? 'suspended' : 'active';
  const newStatus = suspend ? 'suspended' : 'active';

  targetUser.isSuspended = suspend;
  targetUser.suspensionReason = suspend ? reason.trim() : (reason ? reason.trim() : '');
  await targetUser.save();

  // Audit log
  await logAudit({
    adminId: req.user._id,
    action: suspend ? 'USER_SUSPEND' : 'USER_REACTIVATE',
    targetType: 'User',
    targetId: targetUser._id,
    previousStatus,
    newStatus,
    reason: reason ? reason.trim() : (suspend ? 'Administrative suspension' : 'Administrative reinstatement'),
    ip: req.ip,
  });

  res.json({
    message: suspend ? 'User account suspended successfully' : 'User account reactivated successfully',
    user: {
      _id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      isSuspended: targetUser.isSuspended,
      suspensionReason: targetUser.suspensionReason,
    },
  });
};

// ─────────────────────────────────────────────
// @route   GET /api/admin/properties
// @desc    List all platform properties across all owners with moderation filters
// @access  Private (Admin only)
// ─────────────────────────────────────────────
export const getAdminProperties = async (req, res) => {
  const { approvalStatus, available, city, type, search, reported, hasReports, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (approvalStatus) {
    filter.approvalStatus = approvalStatus;
  }
  if (available !== undefined) {
    filter.available = available === 'true';
  }
  if (city) {
    filter.city = { $regex: city, $options: 'i' };
  }
  if (type) {
    filter.type = type;
  }
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { locality: { $regex: search, $options: 'i' } },
    ];
  }

  // Filter properties with reports (item C.13)
  if (reported === 'true' || hasReports === 'true') {
    const reportedPropIds = await PropertyReport.distinct('property');
    filter._id = { $in: reportedPropIds };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [properties, total] = await Promise.all([
    Property.find(filter)
      .populate('owner', 'name email phone isSuspended isVerified')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Property.countDocuments(filter),
  ]);

  res.json({
    properties,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
};

// ─────────────────────────────────────────────
// @route   PUT /api/admin/properties/:id/approval
// @desc    Approve or reject a property listing
// @access  Private (Admin only)
// ─────────────────────────────────────────────
export const updatePropertyApproval = async (req, res) => {
  const { status, reason = '', adminNote } = req.body;
  const propertyId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    return res.status(400).json({ message: 'Invalid property ID' });
  }

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Approval status must be either approved or rejected.' });
  }

  if (status === 'rejected' && (!reason || !reason.trim())) {
    return res.status(400).json({ message: 'A rejection reason is required.' });
  }

  const property = await Property.findById(propertyId);
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }

  // Invalid transition: Cannot approve a removed property without explicit reinstatement workflow
  if (property.approvalStatus === 'removed') {
    return res.status(409).json({ message: 'Invalid transition: Cannot directly approve a removed listing. Listing must be reinstated first.' });
  }

  // Invalid transition: Already in requested state
  if (property.approvalStatus === status) {
    return res.status(409).json({ message: `Invalid transition: Listing is already ${status}.` });
  }

  const previousStatus = property.approvalStatus || 'pending';

  property.approvalStatus = status;
  property.reviewedBy = req.user._id;
  property.reviewedAt = new Date();
  if (status === 'rejected') {
    property.rejectionReason = reason.trim();
  } else {
    property.rejectionReason = '';
  }

  if (adminNote !== undefined) {
    property.adminNote = typeof adminNote === 'string' ? adminNote.trim() : '';
  }

  property.approvalHistory.push({
    status,
    admin: req.user._id,
    reason: reason ? reason.trim() : (status === 'approved' ? 'Listing approved' : 'Listing rejected'),
    date: new Date(),
  });

  await property.save();

  await logAudit({
    adminId: req.user._id,
    action: status === 'approved' ? 'PROPERTY_APPROVE' : 'PROPERTY_REJECT',
    targetType: 'Property',
    targetId: property._id,
    previousStatus,
    newStatus: status,
    reason: reason.trim(),
    ip: req.ip,
  });

  res.json({
    message: `Property listing ${status} successfully.`,
    property,
  });
};

// ─────────────────────────────────────────────
// @route   PUT /api/admin/properties/:id/note
// @desc    Set or update administrative note on a property
// @access  Private (Admin only)
// ─────────────────────────────────────────────
export const setPropertyAdminNote = async (req, res) => {
  const { note } = req.body;
  const propertyId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    return res.status(400).json({ message: 'Invalid property ID' });
  }

  const property = await Property.findById(propertyId);
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }

  const previousNote = property.adminNote || '';
  property.adminNote = typeof note === 'string' ? note.trim() : '';
  await property.save();

  await logAudit({
    adminId: req.user._id,
    action: 'PROPERTY_NOTE',
    targetType: 'Property',
    targetId: property._id,
    previousStatus: previousNote,
    newStatus: property.adminNote,
    reason: 'Admin note updated',
    ip: req.ip,
  });

  res.json({
    message: 'Admin note updated successfully',
    property: {
      _id: property._id,
      adminNote: property.adminNote,
    },
  });
};

// ─────────────────────────────────────────────
// @route   PUT /api/admin/properties/:id/remove
// @desc    Soft-remove a property listing with mandatory reason (Rule 13)
// @access  Private (Admin only)
// ─────────────────────────────────────────────
export const softRemoveProperty = async (req, res) => {
  const { reason } = req.body;
  const propertyId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    return res.status(400).json({ message: 'Invalid property ID' });
  }

  if (!reason || !reason.trim()) {
    return res.status(400).json({ message: 'A specific removal reason is required to remove a listing.' });
  }

  const property = await Property.findById(propertyId);
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }

  if (property.approvalStatus === 'removed') {
    return res.status(409).json({ message: 'Invalid transition: Listing is already marked as removed.' });
  }

  const previousStatus = property.approvalStatus;
  property.approvalStatus = 'removed';
  property.removalReason = reason.trim();
  property.available = false; // Delist from active renting
  property.reviewedBy = req.user._id;
  property.reviewedAt = new Date();

  property.approvalHistory.push({
    status: 'removed',
    admin: req.user._id,
    reason: reason.trim(),
    date: new Date(),
  });

  await property.save();

  await logAudit({
    adminId: req.user._id,
    action: 'PROPERTY_REMOVE',
    targetType: 'Property',
    targetId: property._id,
    previousStatus,
    newStatus: 'removed',
    reason: reason.trim(),
    ip: req.ip,
  });

  res.json({
    message: 'Property listing soft-removed successfully (no hard delete).',
    property,
  });
};

// ─────────────────────────────────────────────
// @route   GET /api/admin/reports
// @desc    List property reports with filter and pagination
// @access  Private (Admin only)
// ─────────────────────────────────────────────
export const getReports = async (req, res) => {
  const { status, category, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;

  const skip = (Number(page) - 1) * Number(limit);

  const [reports, total] = await Promise.all([
    PropertyReport.find(filter)
      .populate('property', 'title city locality price images owner approvalStatus available')
      .populate('reportedBy', 'name email role')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    PropertyReport.countDocuments(filter),
  ]);

  res.json({
    reports,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
};

// ─────────────────────────────────────────────
// @route   PUT /api/admin/reports/:id
// @desc    Update report status and record resolution
// @access  Private (Admin only)
// ─────────────────────────────────────────────
export const updateReportStatus = async (req, res) => {
  const { status, adminNotes = '', resolution = '' } = req.body;
  const reportId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    return res.status(400).json({ message: 'Invalid report ID' });
  }

  if (!['under_review', 'resolved', 'dismissed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be under_review, resolved, or dismissed.' });
  }

  const report = await PropertyReport.findById(reportId);
  if (!report) {
    return res.status(404).json({ message: 'Report not found' });
  }

  // Invalid transition check: Cannot modify an already dismissed report
  if (report.status === 'dismissed') {
    return res.status(409).json({ message: 'Invalid transition: Cannot modify an already dismissed report.' });
  }

  // Invalid transition check: Already in target state
  if (report.status === status) {
    return res.status(409).json({ message: `Invalid transition: Report is already marked as ${status}.` });
  }

  const previousStatus = report.status;
  report.status = status;
  report.adminNotes = adminNotes.trim();
  report.resolution = resolution.trim();
  report.resolvedBy = req.user._id;
  report.resolvedAt = new Date();

  await report.save();

  await logAudit({
    adminId: req.user._id,
    action: 'REPORT_STATUS_UPDATE',
    targetType: 'Report',
    targetId: report._id,
    previousStatus,
    newStatus: status,
    reason: resolution || adminNotes || `Status updated to ${status}`,
    ip: req.ip,
  });

  res.json({
    message: `Report status updated to ${status}.`,
    report,
  });
};

// ─────────────────────────────────────────────
// @route   GET /api/admin/verifications
// @desc    List property verification submissions
// @access  Private (Admin only)
// ─────────────────────────────────────────────
export const getVerifications = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [verifications, total] = await Promise.all([
    VerificationSubmission.find(filter)
      .populate('property', 'title city locality type price approvalStatus')
      .populate('owner', 'name email phone isVerified')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    VerificationSubmission.countDocuments(filter),
  ]);

  res.json({
    verifications,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
};

// ─────────────────────────────────────────────
// @route   PUT /api/admin/verifications/:id
// @desc    Approve or reject property verification
// @access  Private (Admin only)
// ─────────────────────────────────────────────
export const reviewVerification = async (req, res) => {
  const { status, rejectionReason = '' } = req.body;
  const verificationId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(verificationId)) {
    return res.status(400).json({ message: 'Invalid verification ID' });
  }

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be approved or rejected.' });
  }

  if (status === 'rejected' && (!rejectionReason || !rejectionReason.trim())) {
    return res.status(400).json({ message: 'Rejection reason is required when rejecting a verification.' });
  }

  const verification = await VerificationSubmission.findById(verificationId);
  if (!verification) {
    return res.status(404).json({ message: 'Verification submission not found' });
  }

  // Invalid transition check: already in requested state
  if (verification.status === status) {
    return res.status(409).json({ message: `Invalid transition: Verification is already marked as ${status}.` });
  }

  const previousStatus = verification.status;
  verification.status = status;
  verification.rejectionReason = status === 'rejected' ? rejectionReason.trim() : '';
  verification.reviewedBy = req.user._id;
  verification.reviewedAt = new Date();

  await verification.save();

  // Audit log
  await logAudit({
    adminId: req.user._id,
    action: status === 'approved' ? 'VERIFICATION_APPROVE' : 'VERIFICATION_REJECT',
    targetType: 'Verification',
    targetId: verification._id,
    previousStatus,
    newStatus: status,
    reason: rejectionReason.trim() || 'Verification approved',
    ip: req.ip,
  });

  res.json({
    message: `Verification ${status} successfully.`,
    verification,
  });
};

// ─────────────────────────────────────────────
// @route   GET /api/admin/visits
// @desc    Read-only list of visit requests for admin oversight (Rule 8)
// @access  Private (Admin only)
// ─────────────────────────────────────────────
export const getAdminVisitRequests = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [visits, total] = await Promise.all([
    VisitRequest.find(filter)
      .populate('property', 'title city locality price')
      .populate('tenant', 'name email phone')
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    VisitRequest.countDocuments(filter),
  ]);

  res.json({
    visits,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
};

// ─────────────────────────────────────────────
// @route   GET /api/admin/reviews
// @desc    List reviews for moderation with filters (Rule 9)
// @access  Private (Admin only)
// ─────────────────────────────────────────────
export const getAdminReviews = async (req, res) => {
  const { isHidden, isFlagged, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (isHidden !== undefined) filter.isHidden = isHidden === 'true';
  if (isFlagged !== undefined) filter.isFlagged = isFlagged === 'true';

  const skip = (Number(page) - 1) * Number(limit);

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('property', 'title city locality')
      .populate('reviewer', 'name email')
      .populate('moderatedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Review.countDocuments(filter),
  ]);

  res.json({
    reviews,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
};

// ─────────────────────────────────────────────
// @route   PUT /api/admin/reviews/:id/moderate
// @desc    Moderate a review (toggle isHidden or isFlagged). Admin cannot edit text/rating (Rule 9).
// @access  Private (Admin only)
// ─────────────────────────────────────────────
export const moderateReview = async (req, res) => {
  const { isHidden, isFlagged, moderationReason } = req.body;
  const reviewId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return res.status(400).json({ message: 'Invalid review ID' });
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    return res.status(404).json({ message: 'Review not found' });
  }

  // Preserve original content snapshot if hiding
  if (!review.originalContentSnapshot) {
    review.originalContentSnapshot = review.text;
  }

  if (isHidden !== undefined) review.isHidden = Boolean(isHidden);
  if (isFlagged !== undefined) review.isFlagged = Boolean(isFlagged);
  if (moderationReason) review.moderationReason = moderationReason.trim();

  review.moderatedBy = req.user._id;
  review.moderatedAt = new Date();

  await review.save();

  await logAudit({
    adminId: req.user._id,
    action: 'REVIEW_MODERATE',
    targetType: 'Review',
    targetId: review._id,
    previousStatus: review.isHidden ? 'hidden' : 'visible',
    newStatus: isHidden ? 'hidden' : 'visible',
    reason: moderationReason || 'Review moderation state updated',
    ip: req.ip,
  });

  res.json({
    message: 'Review moderated successfully',
    review,
  });
};

// ─────────────────────────────────────────────
// @route   GET /api/admin/audit-logs
// @desc    Retrieve full audit log trail with pagination & filters (Rule 12)
// @access  Private (Admin only)
// ─────────────────────────────────────────────
export const getAuditLogs = async (req, res) => {
  const { action, targetType, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (action) filter.action = action;
  if (targetType) filter.targetType = targetType;

  const skip = (Number(page) - 1) * Number(limit);

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('admin', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    AuditLog.countDocuments(filter),
  ]);

  res.json({
    logs,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
};

// ─────────────────────────────────────────────
// @route   GET /api/admin/users/:id
// @desc    Get detailed user profile (excluding password)
// @access  Private (Admin only)
// ─────────────────────────────────────────────
export const getUserByIdAdmin = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json(user);
};

// ─────────────────────────────────────────────
// @route   GET /api/admin/properties/:id
// @desc    Get full property details including approval history
// @access  Private (Admin only)
// ─────────────────────────────────────────────
export const getPropertyByIdAdmin = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid property ID' });
  }

  const property = await Property.findById(req.params.id)
    .populate('owner', 'name email phone isSuspended isVerified')
    .populate('reviewedBy', 'name email')
    .populate('approvalHistory.admin', 'name email');

  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }

  res.json(property);
};

// ─────────────────────────────────────────────
// @route   GET /api/admin/reports/:id
// @desc    Get single safety report detail
// @access  Private (Admin only)
// ─────────────────────────────────────────────
export const getReportByIdAdmin = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid report ID' });
  }

  const report = await PropertyReport.findById(req.params.id)
    .populate('property', 'title city locality price images owner approvalStatus available')
    .populate('reportedBy', 'name email role')
    .populate('resolvedBy', 'name email');

  if (!report) {
    return res.status(404).json({ message: 'Report not found' });
  }

  let otherReportsOnProperty = {
    count: 0,
    list: [],
  };
  let propertyApprovalStatus = null;

  if (report.property) {
    propertyApprovalStatus = report.property.approvalStatus || null;
    const propertyId = report.property._id || report.property;

    const [others, totalOthers] = await Promise.all([
      PropertyReport.find({
        property: propertyId,
        _id: { $ne: report._id },
      })
        .select('category description status createdAt')
        .populate('reportedBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(10),
      PropertyReport.countDocuments({
        property: propertyId,
        _id: { $ne: report._id },
      }),
    ]);

    otherReportsOnProperty = {
      count: totalOthers,
      list: others,
    };
  }

  const reportData = report.toObject ? report.toObject() : report;

  res.json({
    ...reportData,
    notice: 'Warning signals provided for manual review only.',
    propertyApprovalStatus,
    otherReportsOnProperty,
  });
};

// ─────────────────────────────────────────────
// @route   GET /api/admin/verifications/:id
// @desc    Get single verification submission detail
// @access  Private (Admin only)
// ─────────────────────────────────────────────
export const getVerificationByIdAdmin = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid verification ID' });
  }

  const verification = await VerificationSubmission.findById(req.params.id)
    .populate('property', 'title city locality type price approvalStatus')
    .populate('owner', 'name email phone isVerified')
    .populate('reviewedBy', 'name email');

  if (!verification) {
    return res.status(404).json({ message: 'Verification submission not found' });
  }

  res.json(verification);
};
