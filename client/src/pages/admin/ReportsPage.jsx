// client/src/pages/admin/ReportsPage.jsx
// Platform Safety & Reports Moderation with "Warning signals for manual review",
// contextual report history, and resolution tracking.

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Eye,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  X,
} from 'lucide-react';
import AdminApi from '../../services/adminApi';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import Pagination from '../../components/admin/Pagination';
import FilterBar from '../../components/admin/FilterBar';

export default function ReportsPage() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');

  // Selected Report Detail
  const [selectedReport, setSelectedReport] = useState(null);

  // Status update form state
  const [updateStatus, setUpdateStatus] = useState('under_review');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 10,
        status: status || undefined,
        category: category || undefined,
      };
      const res = await AdminApi.getReports(params);
      setReports(res.reports || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [page, status, category]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const openReportDetail = async (rep) => {
    try {
      const full = await AdminApi.getReportById(rep._id);
      setSelectedReport(full);
      setUpdateStatus(full.status === 'pending' ? 'under_review' : full.status);
      setResolutionNotes(full.resolution || full.adminNotes || '');
    } catch {
      setSelectedReport(rep);
    }
  };

  const handleSaveReportStatus = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;

    try {
      setUpdateLoading(true);
      await AdminApi.updateReportStatus(selectedReport._id, {
        status: updateStatus,
        adminNotes: resolutionNotes,
        resolution: resolutionNotes,
      });

      setToastMessage(`Report status updated to ${updateStatus}.`);
      setTimeout(() => setToastMessage(null), 4000);
      fetchReports();

      // Refresh detail
      const refreshed = await AdminApi.getReportById(selectedReport._id);
      setSelectedReport(refreshed);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update report status');
    } finally {
      setUpdateLoading(false);
    }
  };

  const columns = [
    {
      key: 'category',
      label: 'Category',
      render: (val) => (
        <span className="capitalize text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
          {val ? val.replace(/_/g, ' ') : 'General'}
        </span>
      ),
    },
    {
      key: 'property',
      label: 'Reported Property',
      render: (val) => (
        <div className="max-w-[220px]">
          <p className="font-semibold text-slate-900 truncate">{val?.title || 'Unknown Property'}</p>
          <p className="text-[11px] text-slate-400 truncate">{val?.city || '—'}</p>
        </div>
      ),
    },
    {
      key: 'reportedBy',
      label: 'Reporter',
      render: (val) => (
        <div className="max-w-[150px]">
          <p className="font-semibold text-slate-800 text-xs truncate">{val?.name || 'Anonymous'}</p>
          <p className="text-[11px] text-slate-400 truncate">{val?.email || '—'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'createdAt',
      label: 'Submitted Date',
      render: (val) => (
        <span className="text-xs text-slate-500">
          {val ? new Date(val).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openReportDetail(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            title="Inspect Report"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Reports & Safety</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate tenant safety reports, warning signals, duplicate listings, and moderation resolutions.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          Total Reports: <span className="text-slate-900 font-bold">{total}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <FilterBar
        onReset={() => {
          setStatus('');
          setCategory('');
          setPage(1);
        }}
      >
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>

        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        >
          <option value="">All Categories</option>
          <option value="price_discrepancy">Price Discrepancy</option>
          <option value="fake_photos">Fake / Misleading Photos</option>
          <option value="wrong_contact">Wrong Contact Details</option>
          <option value="already_rented">Already Rented</option>
          <option value="scam_suspicion">Suspicious Terms</option>
          <option value="other">Other</option>
        </select>
      </FilterBar>

      {/* Main Reports Table */}
      <DataTable
        columns={columns}
        data={reports}
        loading={loading}
        error={error}
        onRetry={fetchReports}
        emptyTitle="No safety reports found"
        emptyMessage="No reports match your current filter selection."
      />

      {/* Pagination */}
      <Pagination
        page={page}
        pages={pages}
        total={total}
        onPageChange={(p) => setPage(p)}
      />

      {/* Report Detail Drawer */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 capitalize">
                    {selectedReport.category?.replace(/_/g, ' ')} Report
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Submitted: {new Date(selectedReport.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Warning signals for manual review banner */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Warning Signals for Manual Review</span>
                </div>
                <p className="text-amber-900/90 leading-relaxed text-[11px]">
                  These indicators are calculated to assist administrative verification. They represent signals for manual investigation, never automated conclusions.
                </p>
                <div className="pt-2 border-t border-amber-200/80 flex flex-wrap items-center gap-4 text-amber-900 font-semibold">
                  <div>
                    <span className="text-amber-700 font-normal">Property Status: </span>
                    <span className="capitalize">{selectedReport.propertyApprovalStatus || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-amber-700 font-normal">Other Reports on Listing: </span>
                    <span>{selectedReport.otherReportsOnProperty?.count || 0}</span>
                  </div>
                </div>
              </div>

              {/* Reported Property Card */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Reported Listing Details
                  </p>
                  <button
                    onClick={() => {
                      setSelectedReport(null);
                      navigate('/admin/properties');
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>Open Properties View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                  <img
                    src={selectedReport.property?.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=100'}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="space-y-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">
                      {selectedReport.property?.title || 'Unknown Property'}
                    </p>
                    <p className="text-slate-500">
                      {selectedReport.property?.city} · ₹{selectedReport.property?.price?.toLocaleString()}/mo
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <StatusBadge status={selectedReport.property?.approvalStatus || 'pending'} size="xs" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Reporter's Description */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Report Description
                </p>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-800 leading-relaxed">
                  {selectedReport.description}
                </div>
              </div>

              {/* Reporter Contact */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Submitted By
                </p>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{selectedReport.reportedBy?.name || 'Anonymous'}</p>
                    <p className="text-slate-500">{selectedReport.reportedBy?.email || '—'}</p>
                  </div>
                  <span className="capitalize text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {selectedReport.reportedBy?.role || 'Tenant'}
                  </span>
                </div>
              </div>

              {/* Other Reports on Same Property (History) */}
              {selectedReport.otherReportsOnProperty?.list?.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Other Reports On This Listing ({selectedReport.otherReportsOnProperty.count})
                  </p>
                  <div className="space-y-2">
                    {selectedReport.otherReportsOnProperty.list.map((other) => (
                      <div
                        key={other._id}
                        className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 capitalize">
                            {other.category?.replace(/_/g, ' ')}
                          </span>
                          <StatusBadge status={other.status} size="xs" />
                        </div>
                        <p className="text-slate-600 line-clamp-2">{other.description}</p>
                        <p className="text-[10px] text-slate-400 pt-0.5">
                          {new Date(other.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution Form */}
              <form onSubmit={handleSaveReportStatus} className="p-4 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                  Update Resolution Status
                </p>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Moderation State
                  </label>
                  <select
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value)}
                    disabled={selectedReport.status === 'dismissed'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="under_review">Mark Under Review</option>
                    <option value="resolved">Mark Resolved</option>
                    <option value="dismissed">Dismiss Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Resolution / Administrative Notes
                  </label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Document outcome of verification or reason for resolution/dismissal..."
                    rows={3}
                    disabled={selectedReport.status === 'dismissed'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updateLoading || selectedReport.status === 'dismissed'}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors disabled:opacity-40"
                >
                  {updateLoading ? 'Saving...' : 'Save Resolution'}
                </button>
              </form>
            </div>

            {/* Drawer Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
