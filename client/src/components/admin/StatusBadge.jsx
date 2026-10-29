// client/src/components/admin/StatusBadge.jsx
// Standardized badge component for all moderation, approval, and verification statuses.

import React from 'react';

const statusConfig = {
  // Property approval
  pending: { label: 'Pending Review', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  removed: { label: 'Removed', bg: 'bg-slate-100 text-slate-700 border-slate-300' },

  // Verification status
  verified: { label: 'Deed Verified', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  unverified: { label: 'Unverified', bg: 'bg-slate-50 text-slate-500 border-slate-200' },
  verification_pending: { label: 'Verification In-Review', bg: 'bg-amber-50 text-amber-800 border-amber-200' },

  // User suspension
  active: { label: 'Active', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  suspended: { label: 'Suspended', bg: 'bg-rose-50 text-rose-700 border-rose-200' },

  // Report status
  under_review: { label: 'Under Review', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  resolved: { label: 'Resolved', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  dismissed: { label: 'Dismissed', bg: 'bg-slate-100 text-slate-600 border-slate-200' },

  // Visit status (unified set: pending, accepted, rejected, cancelled, completed)
  accepted: { label: 'Accepted', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  confirmed: { label: 'Accepted', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  completed: { label: 'Completed', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  cancelled: { label: 'Cancelled', bg: 'bg-slate-100 text-slate-600 border-slate-200' },

  // Review status
  visible: { label: 'Visible', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  hidden: { label: 'Hidden', bg: 'bg-slate-100 text-slate-600 border-slate-200' },
  flagged: { label: 'Flagged', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
};

export default function StatusBadge({ status, customLabel, size = 'sm' }) {
  const normalized = (status || '').toString().toLowerCase();
  const config = statusConfig[normalized] || {
    label: customLabel || status || 'Unknown',
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizeClasses = size === 'xs'
    ? 'px-2 py-0.5 text-[10px]'
    : size === 'md'
      ? 'px-3 py-1 text-xs'
      : 'px-2.5 py-0.5 text-[11px]';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${sizeClasses} ${config.bg}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {customLabel || config.label}
    </span>
  );
}
