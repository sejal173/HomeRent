// client/src/pages/admin/ReviewsPage.jsx
// Reviews moderation table: toggle visibility or flagged status with mandatory moderation reason.
// Admin cannot edit review text or rating.

import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  CheckCircle2,
  X,
} from 'lucide-react';
import AdminApi from '../../services/adminApi';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import Pagination from '../../components/admin/Pagination';
import FilterBar from '../../components/admin/FilterBar';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [visibility, setVisibility] = useState('');
  const [flaggedFilter, setFlaggedFilter] = useState('');

  // Moderation Modal
  const [targetReview, setTargetReview] = useState(null);
  const [modHidden, setModHidden] = useState(false);
  const [modFlagged, setModFlagged] = useState(false);
  const [modReason, setModReason] = useState('');
  const [modLoading, setModLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 10,
        isHidden: visibility === 'hidden' ? 'true' : visibility === 'visible' ? 'false' : undefined,
        isFlagged: flaggedFilter === 'flagged' ? 'true' : flaggedFilter === 'normal' ? 'false' : undefined,
      };
      const res = await AdminApi.getReviews(params);
      setReviews(res.reviews || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  }, [page, visibility, flaggedFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleOpenModeration = (rev) => {
    setTargetReview(rev);
    setModHidden(Boolean(rev.isHidden));
    setModFlagged(Boolean(rev.isFlagged));
    setModReason(rev.moderationReason || '');
  };

  const handleSaveModeration = async (e) => {
    e.preventDefault();
    if (!targetReview) return;

    if (!modReason.trim()) {
      alert('A moderation justification reason is required.');
      return;
    }

    try {
      setModLoading(true);
      await AdminApi.moderateReview(targetReview._id, {
        isHidden: modHidden,
        isFlagged: modFlagged,
        moderationReason: modReason.trim(),
      });

      setToastMessage('Review moderation settings saved.');
      setTimeout(() => setToastMessage(null), 4000);
      setTargetReview(null);
      fetchReviews();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update review moderation');
    } finally {
      setModLoading(false);
    }
  };

  const renderStars = (rating = 5) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-3.5 h-3.5 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
          />
        ))}
      </div>
    );
  };

  const columns = [
    {
      key: 'property',
      label: 'Listing',
      render: (val) => (
        <div className="max-w-[200px]">
          <p className="font-semibold text-slate-900 truncate">{val?.title || 'Unknown Listing'}</p>
          <p className="text-[11px] text-slate-400 truncate">{val?.city || '—'}</p>
        </div>
      ),
    },
    {
      key: 'reviewer',
      label: 'Reviewer',
      render: (val) => (
        <div className="max-w-[140px]">
          <p className="font-semibold text-slate-800 text-xs truncate">{val?.name || 'Anonymous'}</p>
          <p className="text-[11px] text-slate-400 truncate">{val?.email || '—'}</p>
        </div>
      ),
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (val) => (
        <div className="flex items-center gap-1.5">
          {renderStars(val)}
          <span className="font-bold text-slate-700 text-xs">{val}/5</span>
        </div>
      ),
    },
    {
      key: 'text',
      label: 'Feedback Snippet',
      render: (val) => (
        <p className="text-xs text-slate-700 line-clamp-2 max-w-[240px]" title={val}>
          "{val}"
        </p>
      ),
    },
    {
      key: 'status',
      label: 'Moderation Status',
      render: (_, row) => {
        if (row.isHidden) return <StatusBadge status="hidden" />;
        if (row.isFlagged) return <StatusBadge status="flagged" />;
        return <StatusBadge status="visible" />;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenModeration(row)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            Moderate
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
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Review Moderation</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain high review standards. Hide abusive text or flag contentious ratings with mandatory audit rationale.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          Total Reviews: <span className="text-slate-900 font-bold">{total}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <FilterBar onReset={() => { setVisibility(''); setFlaggedFilter(''); setPage(1); }}>
        <select
          value={visibility}
          onChange={(e) => {
            setVisibility(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        >
          <option value="">All Visibility</option>
          <option value="visible">Publicly Visible</option>
          <option value="hidden">Hidden by Admin</option>
        </select>

        <select
          value={flaggedFilter}
          onChange={(e) => {
            setFlaggedFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        >
          <option value="">All Flags</option>
          <option value="flagged">Flagged for Review</option>
          <option value="normal">Normal (Unflagged)</option>
        </select>
      </FilterBar>

      {/* Main Reviews Table */}
      <DataTable
        columns={columns}
        data={reviews}
        loading={loading}
        error={error}
        onRetry={fetchReviews}
        emptyTitle="No reviews found"
        emptyMessage="There are currently no reviews matching this moderation filter."
      />

      {/* Pagination */}
      <Pagination
        page={page}
        pages={pages}
        total={total}
        onPageChange={(p) => setPage(p)}
      />

      {/* Moderation Modal */}
      {targetReview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">Moderate Review</h3>
              <button
                onClick={() => setTargetReview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModeration} className="p-6 space-y-4 text-xs">
              {/* Read-only Review Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">
                    By {targetReview.reviewer?.name || 'Anonymous'}
                  </span>
                  {renderStars(targetReview.rating)}
                </div>
                <p className="text-slate-700 italic leading-relaxed">
                  "{targetReview.text}"
                </p>
                <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                  Note: Administrators cannot alter tenant text or ratings. You may toggle public visibility.
                </p>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={modHidden}
                    onChange={(e) => setModHidden(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <div>
                    <span className="font-bold text-slate-800">Hide from Public Listing</span>
                    <p className="text-[11px] text-slate-500">
                      When checked, this review is completely hidden from public visitors.
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={modFlagged}
                    onChange={(e) => setModFlagged(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                  />
                  <div>
                    <span className="font-bold text-slate-800">Flag for Internal Monitoring</span>
                    <p className="text-[11px] text-slate-500">
                      Marks review with a warning flag for supervisor inspection.
                    </p>
                  </div>
                </label>
              </div>

              {/* Mandatory Reason */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Moderation Justification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={modReason}
                  onChange={(e) => setModReason(e.target.value)}
                  placeholder="e.g. Abusive profanity, off-topic slander, landlord dispute resolution..."
                  rows={3}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTargetReview(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  {modLoading ? 'Saving...' : 'Apply Moderation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
