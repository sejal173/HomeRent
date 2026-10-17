// client/src/components/PropertyCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Bed, Bath, Sparkles, CheckCircle2 } from 'lucide-react';
import { useSaved } from '../context/SavedContext';

export default function PropertyCard({ property }) {
  const { isSaved, toggleSave } = useSaved();
  const saved = isSaved(property._id);

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleSave(property._id);
  };

  // Support both backend schema fields (price, locality, type, furnished) and frontend aliases
  const rent = property.price ?? property.monthlyRent ?? 0;
  const propertyType = property.type || property.propertyType || 'Apartment';
  const locality = property.locality || property.area || property.address || '';
  const furnishing = property.furnished || property.furnishingStatus || 'Unfurnished';
  const isAvailable = property.available !== false && property.availabilityStatus !== 'Rented';

  const formattedRent = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rent);

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 flex flex-col h-full hover:-translate-y-1">
      {/* Property Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img
          src={property.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'}
          alt={property.title}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/20 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/95 text-slate-800 shadow-sm backdrop-blur-sm">
              {propertyType}
            </span>
            {property.isFeatured && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500 text-white shadow-sm">
                <Sparkles className="w-3 h-3 fill-white" />
                Featured
              </span>
            )}
          </div>

          {/* Heart button */}
          <button
            onClick={handleFavoriteClick}
            aria-label="Save to favorites"
            className={`pointer-events-auto p-2 rounded-xl backdrop-blur-md transition-transform active:scale-90 ${
              saved
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                : 'bg-white/85 text-slate-700 hover:text-rose-500 hover:bg-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${saved ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Bottom badges (Status and Rating) */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold backdrop-blur-sm ${
              isAvailable ? 'bg-emerald-600/90 text-white' : 'bg-slate-700/90 text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            {isAvailable ? 'Available' : 'Rented'}
          </span>
          {property.rating && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-white/90 text-slate-900 shadow-sm">
              ★ {property.rating}
            </span>
          )}
        </div>
      </div>

      {/* Property Details Body */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Price & Term */}
          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                {formattedRent}
              </span>
              <span className="text-xs text-slate-500 font-medium">/ month</span>
            </div>
            <span className="text-[11px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Verified
            </span>
          </div>

          {/* Title */}
          <Link to={`/properties/${property._id}`} className="block group-hover:text-blue-600 transition-colors">
            <h3 className="font-semibold text-slate-900 text-base line-clamp-1 leading-snug">
              {property.title}
            </h3>
          </Link>

          {/* Location / Area */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5 mb-4">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{locality ? `${locality}, ` : ''}{property.city}</span>
          </div>

          {/* Key Specs Pills */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <Bed className="w-4 h-4 text-blue-500" />
              <span>{property.bedrooms || 1} Beds</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath className="w-4 h-4 text-blue-500" />
              <span>{property.bathrooms || 1} Baths</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="truncate">{furnishing}</span>
            </div>
          </div>
        </div>

        {/* View Details Action Link */}
        <div className="pt-4 mt-1 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Added {property.createdAt ? new Date(property.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently'}
          </span>
          <Link
            to={`/properties/${property._id}`}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
          >
            Explore details &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
