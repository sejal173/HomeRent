// client/src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, PlusCircle, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { UserService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSaved } from '../context/SavedContext';
import PropertyCard from '../components/PropertyCard';
import EmptyState from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function DashboardPage() {
  const { user, isLandlord } = useAuth();
  const { savedIds } = useSaved();
  const [savedProperties, setSavedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load saved properties using real backend endpoint GET /api/users/saved
  useEffect(() => {
    const fetchSavedProperties = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await UserService.getSaved();
        if (res.success && Array.isArray(res.properties)) {
          setSavedProperties(res.properties);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load your saved properties.');
      } finally {
        setLoading(false);
      }
    };

    fetchSavedProperties();
  }, [savedIds.length]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            User Dashboard • {user?.role ? user.role.toUpperCase() : 'USER'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user ? user.name : 'User'}
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            View and manage all the rental properties you have saved to your favorites.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isLandlord && (
            <Link
              to="/add-property"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-md shadow-blue-600/30"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post Listing</span>
            </Link>
          )}
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all backdrop-blur-sm"
          >
            <span>Browse Rentals</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* Saved Properties Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <h2 className="text-xl font-bold text-slate-900">
              Saved Properties ({savedProperties.length})
            </h2>
          </div>
          <Link
            to="/properties"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Explore more listings &rarr;
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading saved properties..." />
        ) : savedProperties.length === 0 ? (
          <EmptyState
            title="No saved properties yet"
            message="You haven't bookmarked any rental properties yet. Browse through our listings and tap the heart icon on any card."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedProperties.map((prop) => (
              <PropertyCard key={prop._id} property={prop} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
