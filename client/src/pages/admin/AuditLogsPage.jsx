// client/src/pages/admin/AuditLogsPage.jsx
// Immutable Audit Trail timeline detailing who did what, when, why, and IP provenance.

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowRight,
} from 'lucide-react';
import AdminApi from '../../services/adminApi';
import DataTable from '../../components/admin/DataTable';
import Pagination from '../../components/admin/Pagination';
import FilterBar from '../../components/admin/FilterBar';

const actionBadges = {
  USER_SUSPEND: 'bg-rose-50 text-rose-700 border-rose-200',
  USER_REACTIVATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PROPERTY_APPROVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PROPERTY_REJECT: 'bg-amber-50 text-amber-800 border-amber-200',
  PROPERTY_NOTE: 'bg-blue-50 text-blue-700 border-blue-200',
  PROPERTY_REMOVE: 'bg-slate-100 text-slate-700 border-slate-300',
  REPORT_STATUS_UPDATE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  VERIFICATION_APPROVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  VERIFICATION_REJECT: 'bg-rose-50 text-rose-700 border-rose-200',
  VERIFICATION_REVIEW: 'bg-blue-50 text-blue-700 border-blue-200',
  REVIEW_MODERATE: 'bg-amber-50 text-amber-800 border-amber-200',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 15,
        action: action || undefined,
        targetType: targetType || undefined,
      };
      const res = await AdminApi.getAuditLogs(params);
      setLogs(res.logs || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch audit trail');
    } finally {
      setLoading(false);
    }
  }, [page, action, targetType]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const columns = [
    {
      key: 'createdAt',
      label: 'Timestamp',
      render: (val) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-900">
            {val ? new Date(val).toLocaleDateString() : '—'}
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            {val ? new Date(val).toLocaleTimeString() : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'admin',
      label: 'Administrator',
      render: (val) => (
        <div className="max-w-[140px]">
          <p className="font-semibold text-slate-800 text-xs truncate">{val?.name || 'Admin'}</p>
          <p className="text-[11px] text-slate-400 truncate">{val?.email || '—'}</p>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action Performed',
      render: (val) => (
        <span
          className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            actionBadges[val] || 'bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'targetType',
      label: 'Target Record',
      render: (val, row) => (
        <div className="text-xs">
          <span className="font-bold text-slate-700">{val}</span>
          <p className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
            {row.targetId}
          </p>
        </div>
      ),
    },
    {
      key: 'transition',
      label: 'State Change',
      render: (_, row) => (
        <div className="text-xs flex items-center gap-1.5 text-slate-600">
          <span className="font-medium">{row.previousStatus || '—'}</span>
          <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="font-bold text-slate-900">{row.newStatus || '—'}</span>
        </div>
      ),
    },
    {
      key: 'reason',
      label: 'Rationale / Justification',
      render: (val) => (
        <p className="text-xs text-slate-700 max-w-[200px] line-clamp-2" title={val}>
          {val || 'Administrative action'}
        </p>
      ),
    },
    {
      key: 'ipAddress',
      label: 'IP Provenance',
      className: 'text-right',
      render: (val) => (
        <span className="text-[11px] font-mono text-slate-400">
          {val || 'internal'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Audit Trail</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable, read-only system log capturing all administrative decisions, actions, and justifications.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          Logged Entries: <span className="text-slate-900 font-bold">{total}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <FilterBar onReset={() => { setAction(''); setTargetType(''); setPage(1); }}>
        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        >
          <option value="">All Actions</option>
          <option value="USER_SUSPEND">USER_SUSPEND</option>
          <option value="USER_REACTIVATE">USER_REACTIVATE</option>
          <option value="PROPERTY_APPROVE">PROPERTY_APPROVE</option>
          <option value="PROPERTY_REJECT">PROPERTY_REJECT</option>
          <option value="PROPERTY_NOTE">PROPERTY_NOTE</option>
          <option value="PROPERTY_REMOVE">PROPERTY_REMOVE</option>
          <option value="REPORT_STATUS_UPDATE">REPORT_STATUS_UPDATE</option>
          <option value="VERIFICATION_APPROVE">VERIFICATION_APPROVE</option>
          <option value="VERIFICATION_REJECT">VERIFICATION_REJECT</option>
          <option value="REVIEW_MODERATE">REVIEW_MODERATE</option>
        </select>

        <select
          value={targetType}
          onChange={(e) => {
            setTargetType(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        >
          <option value="">All Target Types</option>
          <option value="User">User</option>
          <option value="Property">Property</option>
          <option value="Report">Report</option>
          <option value="Verification">Verification</option>
          <option value="Review">Review</option>
        </select>
      </FilterBar>

      {/* Main Audit Trail Table */}
      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        error={error}
        onRetry={fetchLogs}
        emptyTitle="No audit log entries recorded"
        emptyMessage="Audit records will appear here as administrative actions are performed."
      />

      {/* Pagination */}
      <Pagination
        page={page}
        pages={pages}
        total={total}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
}
