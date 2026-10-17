import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Clock, Users, ArrowRight } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import PropertyCard from '../components/PropertyCard';
import { PropertyService } from '../services/api';

export default function HomePage() {
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch featured properties on page load
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await PropertyService.getAll({ limit: 6, sort: 'newest' });
        setFeaturedProperties(data.properties || []);
      } catch {
        setError('Failed to load featured properties.');
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="space-y-16 pb-20">
      
      {/* 1. HERO SECTION WITH SEARCH BAR */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden bg-gradient-to-b from-blue-50/70 via-slate-50/50 to-white">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-32 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-10 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* Top Announcement Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-blue-200/80 shadow-subtle mb-6">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-xs font-semibold text-slate-800 tracking-wide">
              100+ Verified Rental Properties Available
            </span>
            <span className="text-xs text-blue-600 font-bold">&rarr;</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Discover Homes You'll Love to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Rent & Live In</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Search verified apartments, modern villas, and furnished homes across Bengaluru, Mumbai, Delhi NCR, and other top cities with transparent pricing.
          </p>

          {/* Search Bar Component */}
          <div className="mt-10 sm:mt-12">
            <SearchBar />
          </div>

          {/* Trust Highlights */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Direct Owner Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Fast Online Inquiries</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>100+ Test Users & Listings</span>
            </div>
          </div>

        </div>
      </section>

      {/* 2. FEATURED PROPERTIES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-widest mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Handpicked For Quality</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Rental Properties
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Top rated properties with prime amenities and verified landlord contacts.
            </p>
          </div>
          <Link
            to="/properties"
            className="mt-4 md:mt-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:border-blue-600 hover:text-blue-600 text-slate-800 text-sm font-semibold transition-all bg-white shadow-sm"
          >
            <span>See All Listings (100+)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-slate-100 rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((prop) => (
              <PropertyCard key={prop._id} property={prop} />
            ))}
          </div>
        )}
      </section>

      {/* 3. CALL TO ACTION FOR OWNERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-8 sm:p-12 lg:p-16 text-white overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-4">
              For Landlords & Property Owners
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              List Your Property & Reach Verified Tenants in Hours
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed">
              Join 100+ owners who have successfully rented their apartments, studios, and villas through our platform. Zero listing fees for your first 3 properties.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/add-property"
                className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-md shadow-blue-600/30 hover:scale-105"
              >
                Post Your Property Now
              </Link>
              <Link
                to="/dashboard"
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-sm transition-all"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>

          {/* Decorative glowing sphere */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        </div>
      </section>

    </div>
  );
}
