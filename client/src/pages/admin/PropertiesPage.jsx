// client/src/pages/admin/PropertiesPage.jsx
// Comprehensive Property Moderation: tabs, detail view with photo gallery,
// approval history timeline, admin notes, approve/reject/remove workflows.

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Trash2,
  FileEdit,
  Eye,
  X,
  MapPin,
} from 'lucide-react';
import AdminApi from '../../services/adminApi';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import Pagination from '../../components/admin/Pagination';
import SearchInput from '../../components/admin/SearchInput';
import FilterBar from '../../components/admin/FilterBar';

const TABS = [
  { id: 'all', label: 'All Listings' },
  { id: 'pending', label: 'Pending Review' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'rented', label: 'Rented' },
  { id: 'reported', label: 'Reported' },
];

export default function PropertiesPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');

  // Selected property for detail view
  const [selectedProperty, setSelectedProperty] = useState(null);

  // Action Modals State
  const [actionModal, setActionModal] = useState({
    type: null, // 'approve', 'reject', 'note', 'remove'
    property: null,
    isOpen: false,
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        type: type || undefined,
      };

      if (activeTab === 'pending') params.approvalStatus = 'pending';
      else if (activeTab === 'approved') params.approvalStatus = 'approved';
      else if (activeTab === 'rejected') params.approvalStatus = 'rejected';
      else if (activeTab === 'rented') params.available = 'false';
      else if (activeTab === 'reported') params.hasReports = 'true';

      const res = await AdminApi.getProperties(params);
      setProperties(res.properties || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, search, type]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const openPropertyDetail = async (prop) => {
    try {
      const full = await AdminApi.getPropertyById(prop._id);
      setSelectedProperty(full);
    } catch {
      setSelectedProperty(prop);
    }
  };

  const handleApprove = async (prop) => {
    setActionModal({
      type: 'approve',
      property: prop,
      isOpen: true,
    });
  };

  const handleReject = async (prop) => {
    setActionModal({
      type: 'reject',
      property: prop,
      isOpen: true,
    });
  };

  const handleAddNote = async (prop) => {
    setActionModal({
      type: 'note',
      property: prop,
      isOpen: true,
    });
  };

  const handleRemove = async (prop) => {
    setActionModal({
      type: 'remove',
      property: prop,
      isOpen: true,
    });
  };

  const executeAction = async (inputValue) => {
    const { type, property } = actionModal;
    if (!property) return;

    try {
      setActionLoading(true);
      if (type === 'approve') {
        await AdminApi.updatePropertyApproval(property._id, {
          status: 'approved',
          adminNote: inputValue || undefined,
        });
        setToastMessage(`Listing "${property.title}" approved successfully.`);
      } else if (type === 'reject') {
        await AdminApi.updatePropertyApproval(property._id, {
          status: 'rejected',
          reason: inputValue,
        });
        setToastMessage(`Listing "${property.title}" rejected.`);
      } else if (type === 'note') {
        await AdminApi.setPropertyAdminNote(property._id, inputValue);
        setToastMessage('Administrative note saved to property.');
      } else if (type === 'remove') {
        await AdminApi.removeProperty(property._id, inputValue);
        setToastMessage(`Listing "${property.title}" removed.`);
      }

      setActionModal({ type: null, property: null, isOpen: false });
      setTimeout(() => setToastMessage(null), 4000);
      fetchProperties();
      if (selectedProperty && selectedProperty._id === property._id) {
        openPropertyDetail(property);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Property',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=100'}
            alt=""
            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
          />
          <div className="min-w-0 max-w-[200px]">
            <p className="font-semibold text-slate-900 leading-tight truncate">{row.title}</p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="w-3 h-3 shrink-0" />
              <span>{row.locality ? `${row.locality}, ${row.city}` : row.city}</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'owner',
      label: 'Owner / Landlord',
      render: (val) => (
        <div className="min-w-0 max-w-[150px]">
          <p className="font-semibold text-slate-800 text-xs truncate">{val?.name || 'Unknown'}</p>
          <p className="text-[11px] text-slate-400 truncate">{val?.email || '—'}</p>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Rent / Type',
      render: (val, row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs">₹{val?.toLocaleString()}/mo</span>
          <p className="text-[11px] text-slate-500 font-medium">{row.type}</p>
        </div>
      ),
    },
    {
      key: 'approvalStatus',
      label: 'Approval Status',
      render: (val) => <StatusBadge status={val || 'pending'} />,
    },
    {
      key: 'verificationStatus',
      label: 'Verification',
      render: (_, row) => (
        <StatusBadge
          status={row.owner?.isVerified ? 'verified' : 'unverified'}
          size="xs"
        />
      ),
    },
    {
      key: 'available',
      label: 'Availability',
      render: (val) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            val
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          {val ? 'Available' : 'Rented'}
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
            onClick={() => openPropertyDetail(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            title="Inspect Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          {row.approvalStatus !== 'approved' && row.approvalStatus !== 'removed' && (
            <button
              onClick={() => handleApprove(row)}
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
              title="Approve Listing"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}

          {row.approvalStatus !== 'rejected' && row.approvalStatus !== 'removed' && (
            <button
              onClick={() => handleReject(row)}
              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50"
              title="Reject Listing"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => handleAddNote(row)}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
            title="Add Admin Note"
          >
            <FileEdit className="w-4 h-4" />
          </button>

          {row.approvalStatus !== 'removed' && (
            <button
              onClick={() => handleRemove(row)}
              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
              title="Soft-Remove Listing"
            >
              <Trash2 className="w-4 h-4" />
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
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Property Moderation</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review submissions, manage approval workflows, verify landlord listings, and handle removals.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          Showing: <span className="text-slate-900 font-bold">{total}</span> listings
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setPage(1);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <FilterBar
        onReset={() => {
          setSearch('');
          setType('');
          setPage(1);
        }}
      >
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search listings by title, city or locality..."
          className="w-full sm:w-72"
        />

        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        >
          <option value="">All Types</option>
          <option value="Apartment">Apartment</option>
          <option value="Independent House">Independent House</option>
          <option value="Villa">Villa</option>
          <option value="Studio">Studio</option>
          <option value="Penthouse">Penthouse</option>
        </select>
      </FilterBar>

      {/* Main Properties Table */}
      <DataTable
        columns={columns}
        data={properties}
        loading={loading}
        error={error}
        onRetry={fetchProperties}
        emptyTitle="No property listings found"
        emptyMessage="Try selecting a different filter tab or clearing search keywords."
      />

      {/* Pagination */}
      <Pagination
        page={page}
        pages={pages}
        total={total}
        onPageChange={(p) => setPage(p)}
      />

      {/* Property Details Drawer */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedProperty.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StatusBadge status={selectedProperty.approvalStatus || 'pending'} size="xs" />
                    <StatusBadge
                      status={selectedProperty.owner?.isVerified ? 'verified' : 'unverified'}
                      size="xs"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedProperty(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Photo Gallery */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Photo Gallery ({selectedProperty.images?.length || 0})
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {selectedProperty.images && selectedProperty.images.length > 0 ? (
                    selectedProperty.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Property ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-xl border border-slate-200 hover:opacity-90 cursor-pointer"
                        onClick={() => window.open(img, '_blank')}
                      />
                    ))
                  ) : (
                    <div className="col-span-3 py-6 text-center text-slate-400 bg-slate-50 rounded-xl">
                      No photos attached.
                    </div>
                  )}
                </div>
              </div>

              {/* Core Attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Rent</span>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                    ₹{selectedProperty.price?.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Type</span>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">{selectedProperty.type}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Bedrooms</span>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                    {selectedProperty.bedrooms} BHK
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Furnishing</span>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                    {selectedProperty.furnished || 'Unspecified'}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Description
                </p>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 leading-relaxed">
                  {selectedProperty.description || 'No description provided.'}
                </div>
              </div>

              {/* Landlord Contact */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Landlord Information
                </p>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">
                      {selectedProperty.owner?.name || 'Unknown'}
                    </p>
                    <p className="text-slate-500 mt-0.5">{selectedProperty.owner?.email}</p>
                    {selectedProperty.owner?.phone && (
                      <p className="text-slate-500">{selectedProperty.owner?.phone}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <StatusBadge
                      status={selectedProperty.owner?.isVerified ? 'verified' : 'unverified'}
                      size="xs"
                    />
                  </div>
                </div>
              </div>

              {/* Admin Note Box */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Internal Administrative Note
                </p>
                <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-slate-800">
                  {selectedProperty.adminNote ? (
                    <p className="leading-relaxed">{selectedProperty.adminNote}</p>
                  ) : (
                    <p className="text-slate-400 italic">No administrative notes recorded yet.</p>
                  )}
                </div>
              </div>

              {/* Approval History Timeline */}
              {selectedProperty.approvalHistory && selectedProperty.approvalHistory.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Moderation History
                  </p>
                  <div className="space-y-2">
                    {selectedProperty.approvalHistory.map((hist, i) => (
                      <div
                        key={i}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={hist.status} size="xs" />
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(hist.date).toLocaleString()}
                            </span>
                          </div>
                          {hist.reason && (
                            <p className="text-slate-700 text-xs mt-1">
                              <span className="font-semibold text-slate-800">Reason:</span> {hist.reason}
                            </p>
                          )}
                        </div>
                        {hist.admin?.name && (
                          <span className="text-[10px] text-slate-500 font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">
                            By: {hist.admin.name}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => setSelectedProperty(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100"
              >
                Close
              </button>

              <button
                onClick={() => handleAddNote(selectedProperty)}
                className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-xs hover:bg-blue-100"
              >
                Add Note
              </button>

              {selectedProperty.approvalStatus !== 'approved' && selectedProperty.approvalStatus !== 'removed' && (
                <button
                  onClick={() => handleApprove(selectedProperty)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm"
                >
                  Approve Listing
                </button>
              )}

              {selectedProperty.approvalStatus !== 'rejected' && selectedProperty.approvalStatus !== 'removed' && (
                <button
                  onClick={() => handleReject(selectedProperty)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm"
                >
                  Reject Listing
                </button>
              )}

              {selectedProperty.approvalStatus !== 'removed' && (
                <button
                  onClick={() => handleRemove(selectedProperty)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm"
                >
                  Remove Listing
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Dialog Modal */}
      <ConfirmDialog
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ type: null, property: null, isOpen: false })}
        title={
          actionModal.type === 'approve'
            ? 'Approve Property Listing'
            : actionModal.type === 'reject'
              ? 'Reject Property Listing'
              : actionModal.type === 'note'
                ? 'Add Administrative Note'
                : 'Remove Property Listing'
        }
        description={
          actionModal.type === 'approve'
            ? `Are you sure you want to approve "${actionModal.property?.title}"? Once approved, it will be visible on the public platform.`
            : actionModal.type === 'reject'
              ? `Please specify why "${actionModal.property?.title}" is being rejected. The landlord will see this reason.`
              : actionModal.type === 'note'
                ? `Enter an internal administrative note for "${actionModal.property?.title}". Visible to the owner in their listings dashboard.`
                : `Are you sure you want to remove "${actionModal.property?.title}"? It will be hidden from search and cannot be edited by the landlord.`
        }
        confirmText={
          actionModal.type === 'approve'
            ? 'Approve Listing'
            : actionModal.type === 'reject'
              ? 'Reject Listing'
              : actionModal.type === 'note'
                ? 'Save Note'
                : 'Remove Listing'
        }
        confirmVariant={
          actionModal.type === 'approve'
            ? 'success'
            : actionModal.type === 'reject'
              ? 'warning'
              : actionModal.type === 'note'
                ? 'primary'
                : 'danger'
        }
        requireReason={['reject', 'remove', 'note'].includes(actionModal.type)}
        reasonLabel={
          actionModal.type === 'note'
            ? 'Admin Note to Landlord'
            : actionModal.type === 'reject'
              ? 'Rejection Reason (Visible to Landlord)'
              : 'Removal Reason'
        }
        reasonPlaceholder={
          actionModal.type === 'note'
            ? 'e.g. Please provide updated municipal electricity bill to complete verification...'
            : actionModal.type === 'reject'
              ? 'e.g. Insufficient photos or conflicting rent terms...'
              : 'e.g. Unresponsive owner, verified duplicate listing...'
        }
        onConfirm={executeAction}
        loading={actionLoading}
      />
    </div>
  );
}
