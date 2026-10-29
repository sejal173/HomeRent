// client/src/pages/admin/VerificationsPage.jsx
// Verification queue with secure authenticated document viewing (PDF/Image blob viewer)
// and Approve/Reject workflows.

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Eye,
  X,
} from 'lucide-react';
import AdminApi from '../../services/adminApi';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import Pagination from '../../components/admin/Pagination';
import FilterBar from '../../components/admin/FilterBar';

export default function VerificationsPage() {
  const [verifications, setVerifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState('pending'); // Default to pending queue

  // Detail drawer
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null); // { filename, blobUrl, mimeType }
  const [docLoading, setDocLoading] = useState(false);

  // Approve / Reject modal
  const [actionModal, setActionModal] = useState({
    type: null, // 'approve' | 'reject'
    submission: null,
    isOpen: false,
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchVerifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 10,
        status: statusFilter || undefined,
      };
      const res = await AdminApi.getVerifications(params);
      setVerifications(res.verifications || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch verification queue');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const handleOpenDoc = async (doc) => {
    try {
      setDocLoading(true);
      const blob = await AdminApi.fetchDocumentBlob(doc.filename);
      const blobUrl = URL.createObjectURL(blob);
      setPreviewDoc({
        filename: doc.filename,
        originalName: doc.originalName,
        mimeType: doc.mimeType,
        blobUrl,
      });
    } catch {
      alert('Failed to load secure document. Check your admin privileges.');
    } finally {
      setDocLoading(false);
    }
  };

  const handleCloseDocPreview = () => {
    if (previewDoc?.blobUrl) {
      URL.revokeObjectURL(previewDoc.blobUrl);
    }
    setPreviewDoc(null);
  };

  const handleExecuteAction = async (reason) => {
    const { type, submission } = actionModal;
    if (!submission) return;

    try {
      setActionLoading(true);
      if (type === 'approve') {
        await AdminApi.reviewVerification(submission._id, { status: 'approved' });
        setToastMessage('Verification approved. Property deed verified.');
      } else {
        await AdminApi.reviewVerification(submission._id, {
          status: 'rejected',
          rejectionReason: reason,
        });
        setToastMessage('Verification rejected with feedback for landlord.');
      }

      setActionModal({ type: null, submission: null, isOpen: false });
      setTimeout(() => setToastMessage(null), 4000);
      fetchVerifications();
      if (selectedSubmission?._id === submission._id) {
        setSelectedSubmission(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Verification update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: 'property',
      label: 'Property Listing',
      render: (val) => (
        <div className="max-w-[200px]">
          <p className="font-semibold text-slate-900 truncate">{val?.title || 'Unknown Property'}</p>
          <p className="text-[11px] text-slate-400 truncate">{val?.city || '—'}</p>
        </div>
      ),
    },
    {
      key: 'owner',
      label: 'Landlord / Owner',
      render: (val) => (
        <div className="max-w-[150px]">
          <p className="font-semibold text-slate-800 text-xs truncate">{val?.name || 'Unknown'}</p>
          <p className="text-[11px] text-slate-400 truncate">{val?.email || '—'}</p>
        </div>
      ),
    },
    {
      key: 'documents',
      label: 'Submitted Documents',
      render: (val) => (
        <span className="inline-flex items-center gap-1 font-semibold text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
          <FileText className="w-3.5 h-3.5 text-blue-600" />
          <span>{val?.length || 0} file(s)</span>
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'createdAt',
      label: 'Submitted On',
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
            onClick={() => setSelectedSubmission(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            title="Inspect Documents"
          >
            <Eye className="w-4 h-4" />
          </button>

          {row.status !== 'approved' && (
            <button
              onClick={() => setActionModal({ type: 'approve', submission: row, isOpen: true })}
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
              title="Approve Deed"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}

          {row.status !== 'rejected' && (
            <button
              onClick={() => setActionModal({ type: 'reject', submission: row, isOpen: true })}
              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
              title="Reject Submission"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
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
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Property Verification</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review ownership deeds, title documents, and tax receipts submitted by landlords.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          Queue Size: <span className="text-slate-900 font-bold">{total}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <FilterBar onReset={() => { setStatusFilter(''); setPage(1); }}>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        >
          <option value="">All Verification Submissions</option>
          <option value="pending">Pending Queue Only</option>
          <option value="approved">Approved / Verified</option>
          <option value="rejected">Rejected Submissions</option>
        </select>
      </FilterBar>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={verifications}
        loading={loading}
        error={error}
        onRetry={fetchVerifications}
        emptyTitle="No verification records"
        emptyMessage="There are currently no verification submissions matching this queue filter."
      />

      {/* Pagination */}
      <Pagination
        page={page}
        pages={pages}
        total={total}
        onPageChange={(p) => setPage(p)}
      />

      {/* Detail Drawer */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Deed Verification Review</h3>
                  <span className="text-[11px] text-slate-400">
                    Property: {selectedSubmission.property?.title}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Status & Overview */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Submission Status:</span>
                  <StatusBadge status={selectedSubmission.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Landlord:</span>
                  <span className="font-semibold text-slate-900">{selectedSubmission.owner?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-semibold text-slate-900">{selectedSubmission.owner?.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Resubmissions:</span>
                  <span className="font-bold text-slate-700">{selectedSubmission.resubmissionCount || 0}</span>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Uploaded Legal Documents ({selectedSubmission.documents?.length || 0})
                </p>
                <div className="space-y-2">
                  {selectedSubmission.documents?.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate max-w-[220px]">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">
                          {doc.originalName || doc.filename}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenDoc(doc)}
                          disabled={docLoading}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rejection notice if previously rejected */}
              {selectedSubmission.rejectionReason && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                  <p className="font-bold text-rose-800">Current Rejection Reason</p>
                  <p className="text-rose-700 leading-relaxed">
                    {selectedSubmission.rejectionReason}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100"
              >
                Close
              </button>

              {selectedSubmission.status !== 'approved' && (
                <button
                  onClick={() => setActionModal({ type: 'approve', submission: selectedSubmission, isOpen: true })}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm"
                >
                  Approve Verification
                </button>
              )}

              {selectedSubmission.status !== 'rejected' && (
                <button
                  onClick={() => setActionModal({ type: 'reject', submission: selectedSubmission, isOpen: true })}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm"
                >
                  Reject Verification
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Secure Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-md flex flex-col p-4 sm:p-8">
          <div className="flex items-center justify-between pb-4 text-white">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <span className="font-bold text-sm">{previewDoc.originalName}</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={previewDoc.blobUrl}
                download={previewDoc.originalName}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
              <button
                onClick={handleCloseDocPreview}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-2xl overflow-hidden flex items-center justify-center p-2">
            {previewDoc.mimeType === 'application/pdf' ? (
              <iframe
                src={previewDoc.blobUrl}
                title="Document Viewer"
                className="w-full h-full rounded-xl border-none"
              />
            ) : (
              <img
                src={previewDoc.blobUrl}
                alt="Document Preview"
                className="max-h-full max-w-full object-contain rounded-xl"
              />
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ type: null, submission: null, isOpen: false })}
        title={
          actionModal.type === 'approve'
            ? 'Approve Property Verification'
            : 'Reject Property Verification'
        }
        description={
          actionModal.type === 'approve'
            ? 'Are you sure you want to verify this property listing? A deed-verified badge will be assigned to this listing.'
            : 'Please specify the reason for rejecting this verification submission. The landlord will see this reason and may resubmit corrected documents.'
        }
        confirmText={actionModal.type === 'approve' ? 'Approve Deed' : 'Reject Submission'}
        confirmVariant={actionModal.type === 'approve' ? 'success' : 'danger'}
        requireReason={actionModal.type === 'reject'}
        reasonLabel="Rejection Reason for Landlord"
        reasonPlaceholder="e.g. Blurred document, missing stamp from municipal authority, name mismatch..."
        onConfirm={handleExecuteAction}
        loading={actionLoading}
      />
    </div>
  );
}
