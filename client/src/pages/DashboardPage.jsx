import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Building2, CheckCircle2, TrendingUp, IndianRupee, Heart, 
  MapPin, PlusCircle, ArrowUpRight, BarChart3, Clock, ShieldCheck 
} from 'lucide-react';
import { PropertyService } from '../services/api';
import { useSaved } from '../context/SavedContext';
import { useAuth } from '../context/AuthContext';
import PropertyCard from '../components/PropertyCard';
import EmptyState from '../components/EmptyState';

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview'; // 'overview' | 'saved'
  const { savedIds } = useSaved();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [savedProperties, setSavedProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const statsRes = await PropertyService.getStats();
        if (statsRes.success) {
          setStats(statsRes.stats);
        }

        // Fetch saved properties
        if (savedIds.length > 0) {
          const allRes = await PropertyService.getAll({ limit: 120 });
          if (allRes.success) {
            const bookmarked = allRes.properties.filter(p => savedIds.includes(p._id));
            setSavedProperties(bookmarked);
          }
        } else {
          setSavedProperties([]);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [savedIds]);

  const formattedAvgRent = stats?.averageRent
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.averageRent)
    : '₹34,500';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Portfolio Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user ? user.name : 'Guest User'}
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Track rental marketplace statistics, inspect live search query metrics, and manage your saved favorites.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/add-property"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-md shadow-blue-600/30"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post New Listing</span>
          </Link>
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all backdrop-blur-sm"
          >
            <span>Search Rentals</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setSearchParams({ tab: 'overview' })}
          className={`flex items-center gap-2 pb-4 px-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Platform Overview & Stats</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'saved' })}
          className={`flex items-center gap-2 pb-4 px-4 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'saved'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Saved Properties ({savedProperties.length})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Total Listings */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Listings</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {stats?.totalProperties || 108}
              </div>
              <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>100+ Seed dataset ready</span>
              </p>
            </div>

            {/* Available */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Now</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight text-emerald-600">
                {stats?.availableProperties || 101}
              </div>
              <p className="text-xs text-slate-500 mt-2">Ready for immediate move-in</p>
            </div>

            {/* Average Rent */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Monthly Rent</span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {formattedAvgRent}
              </div>
              <p className="text-xs text-slate-500 mt-2">Across 6 tech metro cities</p>
            </div>

            {/* Top Metro Hubs */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Metros</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {stats?.citiesCovered || 6}
              </div>
              <p className="text-xs text-slate-500 mt-2">Bengaluru, Mumbai, Pune, etc.</p>
            </div>

          </div>

          {/* City Distribution breakdown */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-card space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Listings Distribution by City</h2>
              <p className="text-xs text-slate-500 mt-0.5">Live breakdown of seeded and user rental properties</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {stats?.cityBreakdown && Object.entries(stats.cityBreakdown).map(([city, count]) => (
                <Link
                  key={city}
                  to={`/properties?city=${encodeURIComponent(city)}`}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200/70 hover:border-blue-200 transition-all text-center group"
                >
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-blue-600">
                    {city}
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1 group-hover:text-blue-600">
                    {count}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Properties</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Developer Interview Architecture Highlights */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-card space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Full-Stack Architecture & Interview Quick-Reference
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-900 block mb-1 text-sm">Server-Side Pagination</span>
                Limits query response size to 9–12 items per request, minimizing memory footprint and network payload.
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-900 block mb-1 text-sm">Compound MongoDB Indexing</span>
                Indices on <code>{"{ city: 1, monthlyRent: 1 }"}</code> accelerate high-traffic query filters from O(N) to O(log N).
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-900 block mb-1 text-sm">JWT Stateless Auth</span>
                Secure JSON Web Tokens signed with server secret, verified via Express middleware on all mutation endpoints.
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: SAVED FAVORITES */}
      {activeTab === 'saved' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Your Saved Properties</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Properties you have bookmarked for quick comparison and future inquiries
            </p>
          </div>

          {savedProperties.length === 0 ? (
            <EmptyState
              title="No saved properties yet"
              message="You haven't added any properties to your favorites yet. Browse through our listings and tap the heart icon on any card."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedProperties.map((prop) => (
                <PropertyCard key={prop._id} property={prop} />
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
