import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Building2, ArrowLeft, Upload, CheckCircle2, 
  MapPin, IndianRupee, Sparkles, Image, Check, Eye 
} from 'lucide-react';
import { PropertyService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PropertyCard from '../components/PropertyCard';

const CITIES = ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Pune', 'Hyderabad', 'Chennai'];
const TYPES = ['Apartment', 'Villa', 'Independent House', 'Studio', 'Penthouse'];
const FURNISHING_OPTIONS = ['Furnished', 'Semi-Furnished', 'Unfurnished'];

const AVAILABLE_AMENITIES = [
  'High-Speed WiFi',
  'Gym & Fitness',
  'Swimming Pool',
  '24/7 Security',
  'Covered Parking',
  'Power Backup',
  'Balcony View',
  'Clubhouse',
  'Pet Friendly',
  'Air Conditioning',
  'Modular Kitchen',
  'Elevator Access'
];

export default function AddEditPropertyPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

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
    amenities: ['High-Speed WiFi', '24/7 Security', 'Covered Parking'],
    images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80'],
    availabilityStatus: 'Available'
  });

  const [imageUrlInput, setImageUrlInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isEditing) {
      const fetchProperty = async () => {
        try {
          const res = await PropertyService.getById(id);
          if (res.success && res.property) {
            setFormData(res.property);
          }
        } catch (err) {
          console.error('Failed to load property for editing:', err);
        }
      };
      fetchProperty();
    }
  }, [id, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'monthlyRent' || name === 'bedrooms' || name === 'bathrooms' ? Number(value) : value
    }));
  };

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter(a => a !== amenity)
          : [...prev.amenities, amenity]
      };
    });
  };

  const handleAddImage = (e) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, imageUrlInput.trim()]
    }));
    setImageUrlInput('');
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.city || !formData.area || !formData.monthlyRent) {
      setError('Please provide title, city, area, and monthly rent.');
      return;
    }

    if (formData.monthlyRent <= 0) {
      setError('Monthly rent must be greater than zero.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        ownerId: user?.id || 'usr_demo_01',
        ownerName: user?.name || 'Aditya Verma',
        ownerEmail: user?.email || 'aditya@example.com',
        ownerPhone: '+91 98765 43210'
      };

      if (isEditing) {
        await PropertyService.update(id, payload);
      } else {
        await PropertyService.create(payload);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/my-listings');
      }, 1500);
    } catch (err) {
      setError('Failed to save property listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Preview object
  const previewProperty = {
    ...formData,
    _id: id || 'preview_id',
    rating: 4.8,
    isFeatured: true,
    createdAt: new Date().toISOString()
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/my-listings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Listings</span>
        </Link>
        <span className="text-xs text-slate-400">
          {isEditing ? 'Editing Listing' : 'Step 1 of 1: Create Listing'}
        </span>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {isEditing ? 'Edit Property Listing' : 'Post a New Rental Property'}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Fill in the details below. All verified listings are instantly discoverable across search.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Listing saved successfully! Redirecting to your listings...</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT / CENTER: FORM FIELDS (7 COLS) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-card space-y-6">
          
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              1. Basic Information
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Property Title *
              </label>
              <input
                type="text"
                required
                name="title"
                placeholder="e.g. Luxury 3 BHK High-Rise Apartment in Indiranagar"
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
                  {TYPES.map(t => (
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
                  placeholder="e.g. 45000"
                  value={formData.monthlyRent}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Detailed Description
              </label>
              <textarea
                rows={4}
                name="description"
                placeholder="Describe key features, floor level, view, lighting, ventilation, and nearby landmarks..."
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Section 2: Location Details */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              2. Location & Address
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
                  {CITIES.map(c => (
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
                  placeholder="e.g. Indiranagar, HSR Layout, Bandra"
                  value={formData.area}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Street Address
              </label>
              <input
                type="text"
                name="address"
                placeholder="e.g. Flat 402, Green Glen Heights, 100 Feet Road"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 3: Configuration & Furnishing */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              3. Configuration & Specifications
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
                  {[1, 2, 3, 4, 5].map(b => (
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
                  {[1, 2, 3, 4].map(b => (
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
                  {FURNISHING_OPTIONS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Amenities Checkbox Grid */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              4. Included Amenities
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
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
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

          {/* Section 5: Photos (Image URLs) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              5. Photography (Image URLs)
            </h2>

            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Paste an image URL (e.g. Unsplash URL)..."
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Add Image
              </button>
            </div>

            {/* Thumbnail previews */}
            <div className="flex flex-wrap gap-3 pt-2">
              {formData.images.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 group">
                  <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
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

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              to="/my-listings"
              className="px-5 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving Listing...' : isEditing ? 'Update Property Listing' : 'Publish Property Listing'}
            </button>
          </div>

        </form>

        {/* RIGHT: LIVE CARD PREVIEW (5 COLS) */}
        <aside className="lg:col-span-5 space-y-4 sticky top-28">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <Eye className="w-4 h-4 text-blue-600" />
            <span>Live Listing Card Preview</span>
          </div>

          <div className="max-w-md mx-auto w-full">
            <PropertyCard property={previewProperty} />
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
            <span className="font-bold text-slate-700 block">Preview Details:</span>
            <p>This is exactly how potential tenants see your card in the search catalog and homepage recommendations.</p>
          </div>
        </aside>

      </div>

    </div>
  );
}
