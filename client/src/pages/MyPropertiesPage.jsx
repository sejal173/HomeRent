// client/src/pages/MyPropertiesPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusCircle, Edit3, Trash2, CheckCircle2, 
  AlertCircle, Eye, ShieldCheck, Info, X, Loader2
} from 'lucide-react';
import { PropertyService } from '../services/api';
import AdminApi from '../services/adminApi';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function MyPropertiesPage() {
  const { user, isLandlord } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Verification modal state
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [propertyToVerify, setPropertyToVerify] = useState(null);
  const [verifyFiles, setVerifyFiles] = useState([]);
  const [verifyUploading, setVerifyUploading] = useState(false);

  const loadUserProperties = async () => {
    setLoading(true);
    setError('');
    try {
      if (isLandlord) {
        const res = await PropertyService.getMyListings();
        if (res.success && Array.isArray(res.properties)) {
          setProperties(res.properties);
        }
      } else {
        // If a tenant visits, they simply have 0 properties posted
        setProperties([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your property listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserProperties();
  }, [user?._id, isLandlord]);

  const handleToggleStatus = async (prop) => {
    const currentAvailable = prop.available !== false && prop.availabilityStatus !== 'Rented';
    const newAvailable = !currentAvailable;
    const newStatusLabel = newAvailable ? 'Available' : 'Rented';

    try {
      await PropertyService.update(prop._id, {
        available: newAvailable,
        availabilityStatus: newStatusLabel,
      });
      setProperties((prev) =>
        prev.map((p) =>
          p._id === prop._id ? { ...p, available: newAvailable, availabilityStatus: newStatusLabel } : p
        )
      );
      showToast(`Status updated to "${newStatusLabel}"`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update property status');
    }
  };

  const confirmDelete = async () => {
    if (!propertyToDelete) return;
    try {
      await PropertyService.delete(propertyToDelete._id);
      setProperties((prev) => prev.filter((p) => p._id !== propertyToDelete._id));
      showToast('Property deleted successfully.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete property.');
    } finally {
      setDeleteModalOpen(false);
      setPropertyToDelete(null);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            My Property Listings
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your rental listings, toggle occupancy availability, and update property details
          </p>
        </div>

        {isLandlord && (
          <Link
            to="/add-property"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post New Property</span>
          </Link>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* LISTINGS TABLE / CARDS */}
      {loading ? (
        <LoadingSpinner text="Loading your listings..." />
      ) : properties.length === 0 ? (
        <EmptyState
          title={isLandlord ? "No properties listed yet" : "Tenant Account"}
          message={
            isLandlord
              ? "You haven't posted any rental properties yet. Click the button below to add your first listing in 2 minutes."
              : "You are currently signed in as a tenant. If you are a landlord, sign in with your landlord account to post and manage properties."
          }
          onReset={isLandlord ? () => navigate('/add-property') : undefined}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Property</th>
                  <th className="py-4 px-6">Location</th>
                  <th className="py-4 px-6">Monthly Rent</th>
                  <th className="py-4 px-6">Approval Status</th>
                  <th className="py-4 px-6">Availability</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {properties.map((prop) => {
                  const rent = prop.price ?? prop.monthlyRent ?? 0;
                  const locality = prop.locality || prop.area || '';
                  const propType = prop.type || prop.propertyType || 'Apartment';
                  const furnishing = prop.furnished || prop.furnishingStatus || 'Unfurnished';
                  const isAvailable = prop.available !== false && prop.availabilityStatus !== 'Rented';

                  return (
                    <tr key={prop._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Property info & Thumbnail */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={prop.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400'}
                            alt={prop.title}
                            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                          />
                          <div>
                            <Link
                              to={`/properties/${prop._id}`}
                              className="font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1 max-w-xs"
                            >
                              {prop.title}
                            </Link>
                            <span className="text-xs text-slate-400 block mt-0.5">
                              {propType} • Added {prop.createdAt ? new Date(prop.createdAt).toLocaleDateString() : 'Recently'}
                            </span>

                            {/* Informational Note from Admin */}
                            {prop.adminNote && (
                              <div className="mt-2 text-xs p-2.5 bg-blue-50/80 border border-blue-200 text-blue-900 rounded-xl flex items-start gap-2 max-w-md">
                                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold">Note from Admin: </span>
                                  <span>{prop.adminNote}</span>
                                </div>
                              </div>
                            )}

                            {/* Rejection Reason Banner */}
                            {prop.approvalStatus === 'rejected' && (
                              <div className="mt-2 text-xs p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 max-w-md">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-bold">Listing Rejected: </span>
                                    <span>{prop.rejectionReason || 'Please review and update details.'}</span>
                                  </div>
                                </div>
                                <Link
                                  to={`/edit-property/${prop._id}`}
                                  className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-semibold text-[11px] hover:bg-rose-700 shrink-0 text-center"
                                >
                                  Edit listing to resubmit
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-6">
                        <div className="text-xs text-slate-700">
                          <span className="font-semibold block">{locality || prop.city}</span>
                          <span className="text-slate-400">{prop.city}</span>
                        </div>
                      </td>

                      {/* Monthly Rent */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-sm">
                          ₹{rent.toLocaleString('en-IN')}
                          <span className="text-[11px] text-slate-400 font-normal"> / mo</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {prop.bedrooms || 1} Beds · {furnishing}
                        </div>
                      </td>

                      {/* Approval & Verification Status Badges (Rule 4.2) */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1.5 items-start">
                          {(() => {
                            const status = prop.approvalStatus || 'approved';
                            let badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                            let label = 'Pending Review';

                            if (status === 'approved') {
                              badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                              label = 'Approved';
                            } else if (status === 'rejected') {
                              badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                              label = 'Rejected';
                            } else if (status === 'removed') {
                              badgeClass = 'bg-slate-100 text-slate-700 border-slate-300';
                              label = 'Removed';
                            }

                            return (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeClass}`}>
                                <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
                                {label}
                              </span>
                            );
                          })()}

                          {/* Deed Verification Badge (Separate from listing approval) */}
                          {prop.isVerified ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <span className="w-1.5 h-1.5 rounded-full mr-1 bg-blue-500" />
                              Deed Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-500 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full mr-1 bg-slate-400" />
                              Unverified Deed
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleToggleStatus(prop)}
                          title="Click to toggle status"
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            isAvailable
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{isAvailable ? 'Available' : 'Rented'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setPropertyToVerify(prop);
                              setVerifyFiles([]);
                              setVerifyModalOpen(true);
                            }}
                            title="Verify Ownership Deed"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Verify</span>
                          </button>
                          <Link
                            to={`/properties/${prop._id}`}
                            title="View public listing"
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/edit-property/${prop._id}`}
                            title="Edit listing details"
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => {
                              setPropertyToDelete(prop);
                              setDeleteModalOpen(true);
                            }}
                            title="Delete listing"
                            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && propertyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Property Listing?</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Are you sure you want to delete <span className="font-semibold text-slate-800">"{propertyToDelete.title}"</span>? This will permanently remove the listing from public search.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERIFY PROPERTY MODAL */}
      {verifyModalOpen && propertyToVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Verify Property</h3>
                  <p className="text-xs text-slate-400">Ownership Deed or Tax Receipt</p>
                </div>
              </div>
              <button
                onClick={() => setVerifyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Upload municipal deed, purchase contract, or property tax receipt for{' '}
              <span className="font-semibold text-slate-800">"{propertyToVerify.title}"</span>. Once verified by an administrator, your listing receives a Deed-Verified trust badge.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (verifyFiles.length === 0) {
                  alert('Please select at least one document to upload.');
                  return;
                }
                try {
                  setVerifyUploading(true);
                  const formData = new FormData();
                  formData.append('propertyId', propertyToVerify._id);
                  for (let i = 0; i < verifyFiles.length; i++) {
                    formData.append('documents', verifyFiles[i]);
                  }
                  await AdminApi.submitPropertyVerification(formData);
                  showToast('Verification documents submitted successfully for review.');
                  setVerifyModalOpen(false);
                } catch (err) {
                  alert(err.response?.data?.message || 'Failed to submit verification');
                } finally {
                  setVerifyUploading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Documents (PDF, JPG, PNG up to 5MB)
                </label>
                <input
                  type="file"
                  multiple
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={(e) => setVerifyFiles(Array.from(e.target.files || []))}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVerifyModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyUploading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {verifyUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit for Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
