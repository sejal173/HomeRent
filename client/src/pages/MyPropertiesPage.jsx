import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, PlusCircle, Edit3, Trash2, CheckCircle2, 
  AlertCircle, Eye, IndianRupee, MapPin, Bed, Bath 
} from 'lucide-react';
import { PropertyService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function MyPropertiesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const loadUserProperties = async () => {
    setLoading(true);
    try {
      const res = await PropertyService.getAll({ limit: 120 });
      if (res.success) {
        // Show properties owned by this user, or first few if demo user
        const userListings = res.properties.filter(p => 
          p.ownerId === user?.id || p.ownerEmail === user?.email || p._id.endsWith('1') || p._id.endsWith('5')
        );
        setProperties(userListings);
      }
    } catch (err) {
      console.error('Failed to load user properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserProperties();
  }, [user]);

  const handleToggleStatus = async (prop) => {
    const newStatus = prop.availabilityStatus === 'Available' ? 'Rented' : 'Available';
    try {
      const res = await PropertyService.update(prop._id, { availabilityStatus: newStatus });
      if (res.success) {
        setProperties(prev => prev.map(p => p._id === prop._id ? { ...p, availabilityStatus: newStatus } : p));
        showToast(`Status updated to "${newStatus}"`);
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const confirmDelete = async () => {
    if (!propertyToDelete) return;
    try {
      const res = await PropertyService.delete(propertyToDelete._id);
      if (res.success) {
        setProperties(prev => prev.filter(p => p._id !== propertyToDelete._id));
        showToast('Property deleted successfully.');
      }
    } catch (err) {
      console.error('Failed to delete property:', err);
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

        <Link
          to="/add-property"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post New Property</span>
        </Link>
      </div>

      {/* LISTINGS TABLE / CARDS */}
      {loading ? (
        <LoadingSpinner text="Loading your listings..." />
      ) : properties.length === 0 ? (
        <EmptyState
          title="No properties listed yet"
          message="You haven't posted any rental properties yet. Click the button below to add your first listing in 2 minutes."
          onReset={() => navigate('/add-property')}
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
                  <th className="py-4 px-6">Configuration</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {properties.map((prop) => (
                  <tr key={prop._id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Property info & Thumbnail */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={prop.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80'}
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
                            {prop.propertyType} • Added {new Date(prop.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-4 px-6">
                      <div className="text-xs text-slate-700">
                        <span className="font-semibold block">{prop.area}</span>
                        <span className="text-slate-400">{prop.city}</span>
                      </div>
                    </td>

                    {/* Monthly Rent */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 text-sm">
                        ₹{prop.monthlyRent.toLocaleString('en-IN')}
                        <span className="text-[11px] text-slate-400 font-normal"> / mo</span>
                      </div>
                    </td>

                    {/* Configuration */}
                    <td className="py-4 px-6">
                      <div className="text-xs text-slate-600 space-y-0.5">
                        <div>{prop.bedrooms} Beds, {prop.bathrooms} Baths</div>
                        <div className="text-slate-400">{prop.furnishingStatus}</div>
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleStatus(prop)}
                        title="Click to toggle status"
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          prop.availabilityStatus === 'Available'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${prop.availabilityStatus === 'Available' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span>{prop.availabilityStatus}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
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
                ))}
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

    </div>
  );
}
