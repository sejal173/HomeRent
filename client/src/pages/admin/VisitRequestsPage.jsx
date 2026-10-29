// client/src/pages/admin/VisitRequestsPage.jsx
// Read-only oversight table of tenant tour requests across the platform.

import React, { useState, useEffect, useCallback } from 'react';
import AdminApi from '../../services/adminApi';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import Pagination from '../../components/admin/Pagination';
import FilterBar from '../../components/admin/FilterBar';

export default function VisitRequestsPage() {
  const [visits, setVisits] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [status, setStatus] = useState('');

  const fetchVisits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 10,
        status: status || undefined,
      };
      const res = await AdminApi.getVisitRequests(params);
      setVisits(res.visits || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch visit requests');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const columns = [
    {
      key: 'property',
      label: 'Property',
      render: (val) => (
        <div className="max-w-[200px]">
          <p className="font-semibold text-slate-900 truncate">{val?.title || 'Unknown Property'}</p>
          <p className="text-[11px] text-slate-400 truncate">
            {val?.locality ? `${val.locality}, ${val.city}` : val?.city || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'tenant',
      label: 'Tenant',
      render: (val, row) => (
        <div className="max-w-[150px]">
          <p className="font-semibold text-slate-800 text-xs truncate">
            {val?.name || row.tenantName || 'Tenant'}
          </p>
          <p className="text-[11px] text-slate-400 truncate">
            {val?.email || row.tenantPhone || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'owner',
      label: 'Landlord',
      render: (val) => (
        <div className="max-w-[150px]">
          <p className="font-semibold text-slate-800 text-xs truncate">{val?.name || 'Landlord'}</p>
          <p className="text-[11px] text-slate-400 truncate">{val?.email || '—'}</p>
        </div>
      ),
    },
    {
      key: 'requestedDate',
      label: 'Scheduled For',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-slate-800 text-xs">
            {val ? new Date(val).toLocaleDateString() : '—'}
          </span>
          <p className="text-[11px] text-slate-500 font-medium">{row.requestedTime || 'Flexible'}</p>
        </div>
      ),
    },
    {
      key: 'message',
      label: 'Inquiry Message',
      render: (val) => (
        <p className="text-xs text-slate-600 line-clamp-2 max-w-[220px]" title={val}>
          {val || 'No special instructions.'}
        </p>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Visit Requests</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Read-only platform oversight of tenant tour requests and landlord scheduling responsiveness.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          Total Tour Requests: <span className="text-slate-900 font-bold">{total}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <FilterBar onReset={() => { setStatus(''); setPage(1); }}>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        >
          <option value="">All Visit Statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
      </FilterBar>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={visits}
        loading={loading}
        error={error}
        onRetry={fetchVisits}
        emptyTitle="No tour requests found"
        emptyMessage="There are currently no visit requests matching this filter criteria."
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
