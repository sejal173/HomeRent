// client/src/pages/AddEditPropertyPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Check } from 'lucide-react';
import { PropertyService } from '../services/api';

const CITIES = ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Pune', 'Hyderabad', 'Chennai'];
const TYPES = ['Apartment', 'Villa', 'House', 'Studio', 'PG'];
const FURNISHING_OPTIONS = ['Furnished', 'Semi-Furnished', 'Unfurnished'];

const AVAILABLE_AMENITIES = [
  'Parking',
  'Gym',
  'Pool',
  'Security',
  'Power Backup',
  'Lift',
  'Garden',
  'Club House',
  'High-Speed WiFi',
  'Air Conditioning',
  'Modular Kitchen',
  'Pet Friendly',
];

export default function AddEditPropertyPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  // Form input state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: 'Bengaluru',
    area: '',
    address: '',
    monthlyRent: '',
    propertyType: 'Apartment',
    bedrooms: 2,
    bathrooms: 2,
    furnishingStatus: 'Furnished',
    amenities: ['Parking', 'Security', 'Power Backup'],
    images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'],
    availabilityStatus: 'Available',
  });

  const [imageUrlInput, setImageUrlInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // If in edit mode, load the existing property data
  useEffect(() => {
    if (isEditing) {
      const fetchProperty = async () => {
        try {
          const res = await PropertyService.getById(id);
          if (res.success && res.property) {
            const p = res.property;
            setFormData({
              title: p.title || '',
              description: p.description || '',
              city: p.city || 'Bengaluru',
              area: p.locality || p.area || '',
              address: p.address || '',
              monthlyRent: p.price ?? p.monthlyRent ?? '',
              propertyType: p.type || p.propertyType || 'Apartment',
              bedrooms: p.bedrooms || 2,
              bathrooms: p.bathrooms || 2,
              furnishingStatus: p.furnished || p.furnishingStatus || 'Furnished',
              amenities: p.amenities || [],
              images: p.images?.length ? p.images : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'],
              availabilityStatus: p.available !== false ? 'Available' : 'Rented',
            });
          }
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to load property for editing.');
        }
      };
      fetchProperty();
    }
  }, [id, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'monthlyRent' || name === 'bedrooms' || name === 'bathrooms' ? Number(value) : value,
    }));
  };

  const handleAmenityToggle = (amenity) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleAddImage = (e) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, imageUrlInput.trim()],
    }));
    setImageUrlInput('');
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Form submit handler with validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Please provide a property title.');
      return;
    }
    if (!formData.city) {
      setError('Please select a city.');
      return;
    }
    if (!formData.area.trim()) {
      setError('Please enter the area / neighborhood.');
      return;
    }
    if (!formData.monthlyRent || formData.monthlyRent <= 0) {
      setError('Monthly rent must be a positive number.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || `Beautiful ${formData.propertyType} in ${formData.area}, ${formData.city}.`,
        type: formData.propertyType,
        price: Number(formData.monthlyRent),
        city: formData.city,
        locality: formData.area.trim(),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        furnished: formData.furnishingStatus,
        amenities: formData.amenities,
        images: formData.images.length > 0 ? formData.images : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'],
      };

      if (isEditing) {
        await PropertyService.update(id, payload);
      } else {
        await PropertyService.create(payload);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/my-listings');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save property listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/my-listings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Listings</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {isEditing ? 'Edit Property Listing' : 'Post a New Rental Property'}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {isEditing
            ? 'Update your property details and save the changes.'
            : 'Fill in the details below to publish your property for rent.'}
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* Success alert */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Listing saved successfully! Redirecting to your listings...</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-card space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            1. Property Overview
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Property Title *
            </label>
            <input
              type="text"
              required
              name="title"
              placeholder="e.g. Spacious 3 BHK Apartment in Indiranagar"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Property Type
              </label>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Monthly Rent (₹) *
              </label>
              <input
                type="number"
                required
                name="monthlyRent"
                placeholder="e.g. 35000"
                value={formData.monthlyRent}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              name="description"
              placeholder="Describe the property, floor, natural lighting, and nearby landmarks..."
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Location */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            2. Location Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                City *
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Area / Neighborhood *
              </label>
              <input
                type="text"
                required
                name="area"
                placeholder="e.g. Indiranagar, HSR Layout, Powai"
                value={formData.area}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            3. Rooms & Furnishing
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Bedrooms
              </label>
              <select
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map((b) => (
                  <option key={b} value={b}>{b} BHK</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Bathrooms
              </label>
              <select
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none"
              >
                {[1, 2, 3, 4].map((b) => (
                  <option key={b} value={b}>{b} Baths</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Furnishing
              </label>
              <select
                name="furnishingStatus"
                value={formData.furnishingStatus}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none"
              >
                {FURNISHING_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            4. Amenities Included
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {AVAILABLE_AMENITIES.map((amenity) => {
              const checked = formData.amenities.includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => handleAmenityToggle(amenity)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-left transition-all border ${
                    checked
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                    checked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {checked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="truncate">{amenity}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Photos */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            5. Photos (Image URLs)
          </h2>

          <div className="flex gap-2">
            <input
              type="url"
              placeholder="Paste image URL here..."
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddImage}
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
            >
              Add Photo
            </button>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            {formData.images.map((img, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 group">
                <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute inset-0 bg-black/60 text-white text-xs font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            to="/my-listings"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEditing ? 'Update Property' : 'Publish Property'}
          </button>
        </div>
      </form>
    </div>
  );
}
