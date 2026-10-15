import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, RotateCcw, SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import { PropertyCardSkeleton } from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { PropertyService } from '../services/api';

const CITIES = ['All Cities', 'Bengaluru', 'Mumbai', 'Delhi NCR', 'Pune', 'Hyderabad', 'Chennai'];
const TYPES = ['All Types', 'Apartment', 'Villa', 'Independent House', 'Studio', 'Penthouse'];
const FURNISHING_OPTIONS = ['All', 'Furnished', 'Semi-Furnished', 'Unfurnished'];
const BEDROOM_OPTIONS = ['Any', '1', '2', '3', '4'];

export default function PropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter state synced with URL queries
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || 'All Cities');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'All Types');
  const [minRent, setMinRent] = useState(searchParams.get('minRent') || '');
  const [maxRent, setMaxRent] = useState(searchParams.get('maxRent') || '');
  const [selectedBedrooms, setSelectedBedrooms] = useState(searchParams.get('bedrooms') || 'Any');
  const [selectedFurnishing, setSelectedFurnishing] = useState(searchParams.get('furnishing') || 'All');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page'), 10) || 1);

  // Results state
  const [properties, setProperties] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync budget shortcut from hero search bar if passed
  useEffect(() => {
    const budgetParam = searchParams.get('budget');
    if (budgetParam === 'under_25k') {
      setMinRent('');
      setMaxRent('25000');
    } else if (budgetParam === '25k_50k') {
      setMinRent('25000');
      setMaxRent('50000');
    } else if (budgetParam === '50k_100k') {
      setMinRent('50000');
      setMaxRent('100000');
    } else if (budgetParam === 'above_100k') {
      setMinRent('100000');
      setMaxRent('');
    }
  }, [searchParams]);

  // Fetch properties whenever filters or pagination change
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const queryParams = {
          search: searchQuery,
          city: selectedCity,
          type: selectedType,
          minRent,
          maxRent,
          bedrooms: selectedBedrooms,
          furnishing: selectedFurnishing,
          sortBy,
          page: currentPage,
          limit: 9
        };

        const res = await PropertyService.getAll(queryParams);
        if (res.success) {
          setProperties(res.properties);
          setTotalCount(res.total);
          setTotalPages(res.totalPages);
        }
      } catch (err) {
        console.error('Failed to fetch properties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchQuery, selectedCity, selectedType, minRent, maxRent, selectedBedrooms, selectedFurnishing, sortBy, currentPage]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCity('All Cities');
    setSelectedType('All Types');
    setMinRent('');
    setMaxRent('');
    setSelectedBedrooms('Any');
    setSelectedFurnishing('All');
    setSortBy('newest');
    setCurrentPage(1);
    setSearchParams({});
  };

  const hasActiveFilters =
    searchQuery ||
    (selectedCity && selectedCity !== 'All Cities') ||
    (selectedType && selectedType !== 'All Types') ||
    minRent ||
    maxRent ||
    (selectedBedrooms && selectedBedrooms !== 'Any') ||
    (selectedFurnishing && selectedFurnishing !== 'All');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Browse Rental Properties
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Showing verified rental homes, apartments, and villas with live availability
          </p>
        </div>

        {/* Search bar inside header */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by city, area, or title..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Layout: Sidebar Filters + Property Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-8">
        
        {/* MOBILE FILTER TOGGLE BUTTON */}
        <div className="lg:hidden flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-sm font-semibold text-slate-700">
            {totalCount} Properties Found
          </span>
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filter & Sort</span>
          </button>
        </div>

        {/* SIDEBAR FILTERS (Desktop & Mobile) */}
        <aside
          className={`${
            mobileFilterOpen ? 'block fixed inset-0 z-50 bg-white p-6 overflow-y-auto' : 'hidden lg:block'
          } lg:col-span-1 space-y-6`}
        >
          {mobileFilterOpen && (
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 lg:hidden">
              <h2 className="text-lg font-bold text-slate-900">Filter Properties</h2>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-card space-y-6">
            
            {/* Header with Reset */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Filter className="w-4 h-4 text-blue-600" />
                <span>Filters</span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear All
                </button>
              )}
            </div>

            {/* City Filter */}
            <div>
              <label htmlFor="filter-city" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                City / Location
              </label>
              <select
                id="filter-city"
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Property Type Filter */}
            <div>
              <label htmlFor="filter-property-type" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Property Type
              </label>
              <select
                id="filter-property-type"
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Monthly Rent Range */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Monthly Rent (₹)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min (e.g. 15000)"
                  value={minRent}
                  onChange={(e) => {
                    setMinRent(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Max (e.g. 60000)"
                  value={maxRent}
                  onChange={(e) => {
                    setMaxRent(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Bedrooms (BHK) Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Bedrooms (BHK)
              </label>
              <div className="flex gap-1.5">
                {BEDROOM_OPTIONS.map((beds) => (
                  <button
                    key={beds}
                    type="button"
                    onClick={() => {
                      setSelectedBedrooms(beds);
                      setCurrentPage(1);
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selectedBedrooms === beds
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {beds === 'Any' ? 'Any' : `${beds}+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Furnishing Status Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Furnishing
              </label>
              <div className="space-y-1.5">
                {FURNISHING_OPTIONS.map((furn) => (
                  <label
                    key={furn}
                    className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer py-1"
                  >
                    <input
                      type="radio"
                      name="furnishing"
                      value={furn}
                      checked={selectedFurnishing === furn}
                      onChange={(e) => {
                        setSelectedFurnishing(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span>{furn === 'All' ? 'All Furnishing Types' : furn}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Mobile close button */}
            {mobileFilterOpen && (
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl text-sm"
              >
                Apply Filters ({totalCount} Properties)
              </button>
            )}

          </div>
        </aside>

        {/* RIGHT SIDE: SORT HEADER, PROPERTIES GRID & PAGINATION */}
        <main className="lg:col-span-3 space-y-6">
          
          {/* Top Results Bar with Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-sm text-slate-600 font-medium">
              Showing <span className="font-bold text-slate-900">{properties.length}</span> of{' '}
              <span className="font-bold text-slate-900">{totalCount}</span> rental listings
              {selectedCity !== 'All Cities' && (
                <span className="text-blue-600 font-semibold"> in {selectedCity}</span>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort-listings" className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                Sort By:
              </label>
              <select
                id="sort-listings"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="newest">Newest Listed</option>
                <option value="rent_low_to_high">Rent: Low to High</option>
                <option value="rent_high_to_low">Rent: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {/* ACTIVE FILTER BADGES */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Active:</span>
              {selectedCity !== 'All Cities' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  City: {selectedCity}
                  <button onClick={() => setSelectedCity('All Cities')} className="hover:text-blue-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedType !== 'All Types' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Type: {selectedType}
                  <button onClick={() => setSelectedType('All Types')} className="hover:text-blue-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedBedrooms !== 'Any' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Bedrooms: {selectedBedrooms}+ BHK
                  <button onClick={() => setSelectedBedrooms('Any')} className="hover:text-blue-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedFurnishing !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Furnishing: {selectedFurnishing}
                  <button onClick={() => setSelectedFurnishing('All')} className="hover:text-blue-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(minRent || maxRent) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Rent: ₹{minRent || '0'} - ₹{maxRent || 'Max'}
                  <button onClick={() => { setMinRent(''); setMaxRent(''); }} className="hover:text-blue-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* PROPERTIES GRID */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <PropertyCardSkeleton key={n} />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <EmptyState onReset={handleResetFilters} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {properties.map((prop) => (
                <PropertyCard key={prop._id} property={prop} />
              ))}
            </div>
          )}

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && !loading && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-200">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </main>

      </div>
    </div>
  );
}
