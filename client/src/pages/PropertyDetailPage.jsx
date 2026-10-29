// client/src/pages/PropertyDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Heart, MapPin, Bed, Bath, Sparkles, ShieldCheck, CheckCircle2, 
  Share2, Phone, Mail, ArrowLeft, Send, CheckCircle, Award,
  AlertTriangle, Star, X, Loader2
} from 'lucide-react';
import { PropertyService } from '../services/api';
import AdminApi from '../services/adminApi';
import { useAuth } from '../context/AuthContext';
import { useSaved } from '../context/SavedContext';
import PropertyCard from '../components/PropertyCard';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated, isLandlord } = useAuth();
  const { isSaved, toggleSave } = useSaved();
  const [property, setProperty] = useState(null);
  const [similarProperties, setSimilarProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Inquiry & Tour scheduling states
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryDate, setInquiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [inquiryTime, setInquiryTime] = useState('11:00 AM');
  const [inquiryMessage, setInquiryMessage] = useState('Hello, I am interested in this rental property and would like to arrange a site visit.');
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Safety Reporting modal states
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState('price_discrepancy');
  const [reportDescription, setReportDescription] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  // Reviews states
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await PropertyService.getById(id);
        if (res.success && res.property) {
          setProperty(res.property);
          setActiveImageIndex(0);

          // Fetch similar listings in same city
          try {
            const simRes = await PropertyService.getAll({
              city: res.property.city,
              limit: 4,
            });
            if (simRes.success && Array.isArray(simRes.properties)) {
              setSimilarProperties(simRes.properties.filter((p) => p._id !== res.property._id).slice(0, 3));
            }
          } catch {
            // Non-critical if similar listings fail
          }
        } else {
          setError('Property not found');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load property details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();

    // Fetch property reviews
    const fetchReviews = async () => {
      try {
        const revs = await AdminApi.getPropertyReviews(id);
        setReviews(Array.isArray(revs) ? revs : []);
      } catch {
        // Non-critical
      }
    };
    fetchReviews();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    try {
      setInquiryLoading(true);
      await AdminApi.submitVisitRequest({
        propertyId: id,
        requestedDate: inquiryDate ? new Date(inquiryDate).toISOString() : new Date().toISOString(),
        requestedTime: inquiryTime,
        message: inquiryMessage,
        tenantName: inquiryName || user?.name,
        tenantPhone: inquiryPhone || user?.phone,
      });

      setInquirySubmitted(true);
      setTimeout(() => {
        setInquirySubmitted(false);
      }, 5000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit visit inquiry.');
    } finally {
      setInquiryLoading(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    if (!reportDescription.trim()) {
      alert('Please describe your safety or listing accuracy concern.');
      return;
    }

    try {
      setReportLoading(true);
      await AdminApi.submitReport({
        propertyId: id,
        category: reportCategory,
        description: reportDescription.trim(),
      });
      setReportModalOpen(false);
      setReportDescription('');
      setToastMessage('Report submitted successfully for administrative safety review.');
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit report. Rate limit may apply.');
    } finally {
      setReportLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    if (!reviewText.trim()) {
      alert('Please enter your review text.');
      return;
    }

    try {
      setReviewSubmitting(true);
      const newRev = await AdminApi.submitReview({
        propertyId: id,
        rating: reviewRating,
        text: reviewText.trim(),
      });
      setReviews((prev) => [newRev, ...prev]);
      setReviewText('');
      setReviewRating(5);
      setToastMessage('Thank you! Your review has been posted.');
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return <LoadingSpinner text="Loading property details..." />;
  }

  if (error || !property) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-800">{error || 'Property not found'}</h2>
        <Link to="/properties" className="mt-4 inline-block text-blue-600 font-semibold">
          &larr; Back to Listings
        </Link>
      </div>
    );
  }

  const saved = isSaved(property._id);
  const rent = property.price ?? property.monthlyRent ?? 0;
  const propertyType = property.type || property.propertyType || 'Apartment';
  const locality = property.locality || property.area || property.address || '';
  const furnishing = property.furnished || property.furnishingStatus || 'Unfurnished';
  const isAvailable = property.available !== false && property.availabilityStatus !== 'Rented';
  const ownerName = property.owner?.name || property.ownerName || 'Verified Landlord';
  const ownerEmail = property.owner?.email || property.ownerEmail || 'contact@homerent.dev';
  const ownerPhone = property.owner?.phone || property.ownerPhone || '+91 98765 43210';

  const formattedRent = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rent);

  const securityDeposit = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rent * 2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          to="/properties"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Properties</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
          </button>

          <button
            onClick={() => toggleSave(property._id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
              saved
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${saved ? 'fill-rose-500' : ''}`} />
            <span>{saved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Main Property Title & Location */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {propertyType}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                isAvailable
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              ● {isAvailable ? 'Available' : 'Rented'}
            </span>
            {property.isFeatured && (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Featured
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            {property.title}
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-slate-500 mt-2">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{property.address || `${locality}, ${property.city}`}</span>
          </p>
        </div>

        <div className="text-left md:text-right bg-blue-50/60 p-4 rounded-2xl border border-blue-100/80">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Rent</div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight text-blue-600">
            {formattedRent}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Security Deposit: <span className="font-semibold text-slate-700">{securityDeposit}</span>
          </div>
        </div>
      </div>

      {/* PHOTO GALLERY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Photo */}
        <div className="lg:col-span-2 aspect-[16/10] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-card relative">
          <img
            src={property.images?.[activeImageIndex] || property.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'}
            alt={property.title}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800';
            }}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Thumbnails Column */}
        <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-visible">
          {property.images?.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImageIndex(idx)}
              className={`relative flex-1 rounded-2xl overflow-hidden aspect-[16/10] border-2 transition-all shrink-0 ${
                activeImageIndex === idx
                  ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-md'
                  : 'border-transparent opacity-75 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`View ${idx + 1}`}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800';
                }}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* TWO-COLUMN DETAILS + INQUIRY FORM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        
        {/* LEFT COLUMN: SPECS, DESCRIPTION & AMENITIES (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Key Attributes Highlights Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
            <div className="p-3 rounded-xl bg-slate-50">
              <Bed className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
              <div className="text-xs text-slate-500">Bedrooms</div>
              <div className="text-sm font-bold text-slate-900">{property.bedrooms || 1} Beds</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">
              <Bath className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
              <div className="text-xs text-slate-500">Bathrooms</div>
              <div className="text-sm font-bold text-slate-900">{property.bathrooms || 1} Baths</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">
              <Sparkles className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
              <div className="text-xs text-slate-500">Furnishing</div>
              <div className="text-sm font-bold text-slate-900 truncate">{furnishing}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">
              <ShieldCheck className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
              <div className="text-xs text-slate-500">Listed By</div>
              <div className="text-sm font-bold text-slate-900 truncate">{ownerName}</div>
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-card space-y-4">
            <h2 className="text-lg font-bold text-slate-900">About this Property</h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Amenities Grid */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-card space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Features & Amenities</h2>
              <span className="text-xs text-slate-400 font-medium">Included in monthly rent</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {property.amenities?.map((amenity, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Location & Neighborhood Summary */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-card space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Location Highlights</h2>
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900 block text-sm mb-1">{locality ? `${locality}, ` : ''}{property.city}</span>
                Prime residential location with easy access to transit, shopping centres, and daily conveniences.
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: OWNER PROFILE & INQUIRY FORM (1/3) */}
        <div className="space-y-6">
          
          {/* Owner Details Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center uppercase shadow-md shadow-blue-500/20">
                {ownerName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-slate-900 text-base">{ownerName}</h3>
                  <Award className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-xs text-slate-500">Verified Landlord</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{ownerEmail}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{ownerPhone}</span>
              </div>
            </div>
          </div>

          {/* Interactive Inquiry Form */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-card space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Schedule Visit / Inquiry
            </h3>
            <p className="text-xs text-slate-500 leading-normal">
              Send your preferred move-in date and contact number directly to the landlord.
            </p>

            {inquirySubmitted ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm">Inquiry Sent Successfully!</h4>
                <p className="text-xs text-emerald-700">
                  The landlord has received your inquiry and will reach out to your phone number soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sneha Sharma"
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 00000"
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        required
                        value={inquiryDate}
                        onChange={(e) => setInquiryDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Preferred Time
                      </label>
                      <select
                        value={inquiryTime}
                        onChange={(e) => setInquiryTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="10:00 AM">10:00 AM</option>
                        <option value="11:00 AM">11:00 AM</option>
                        <option value="02:00 PM">02:00 PM</option>
                        <option value="04:00 PM">04:00 PM</option>
                        <option value="06:00 PM">06:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Message / Special Requests
                    </label>
                    <textarea
                      rows={2}
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={inquiryLoading}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide uppercase flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all hover:scale-[1.01] disabled:opacity-50"
                  >
                    {inquiryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{isAuthenticated ? 'Schedule Site Visit' : 'Sign In to Schedule Visit'}</span>
                  </button>
                </form>
              )}

              {/* Report Listing Safety Button */}
              <div className="text-center pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Report this listing for review</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      {/* REVIEWS & RATINGS SECTION */}
      <div className="pt-12 border-t border-slate-200 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>Property Reviews & Feedback</span>
              <span className="text-sm font-normal text-slate-500">({reviews.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">Verified tenant impressions and ratings</p>
          </div>
        </div>

        {/* Tenant review form */}
        {isAuthenticated && !isLandlord && (
          <form onSubmit={handleReviewSubmit} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Leave Your Review</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-medium">Rating:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setReviewRating(s)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${s <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              rows={3}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share details of your tour, neighborhood feel, or property condition..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={reviewSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                {reviewSubmitting ? 'Posting...' : 'Post Review'}
              </button>
            </div>
          </form>
        )}

        {/* Reviews list */}
        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div key={rev._id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center uppercase">
                      {rev.reviewer?.name ? rev.reviewer.name.charAt(0) : 'T'}
                    </div>
                    <span className="text-xs font-bold text-slate-800">{rev.reviewer?.name || 'Tenant'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{rev.text}"
                </p>
                <span className="text-[10px] text-slate-400 block">
                  {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recent review'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            No reviews posted for this property yet.
          </div>
        )}
      </div>

      {/* REPORT LISTING SAFETY MODAL */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Report Listing Issue</h3>
                  <p className="text-xs text-slate-400">Safety & Accuracy Review</p>
                </div>
              </div>
              <button
                onClick={() => setReportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Help us maintain an accurate, high-trust marketplace. Submit this listing for review by our administrative moderation team.
            </p>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Report Category
                </label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  <option value="price_discrepancy">Price Discrepancy / Hidden Charges</option>
                  <option value="fake_photos">Inaccurate or Misleading Photos</option>
                  <option value="wrong_contact">Incorrect Contact or Address</option>
                  <option value="already_rented">Already Rented / Unavailable</option>
                  <option value="scam_suspicion">Suspicious Terms / Safety Concern</option>
                  <option value="other">Other Accuracy Concern</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Detailed Explanation
                </label>
                <textarea
                  rows={3}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Describe the discrepancy or concern observed..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportLoading}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {reportLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Report</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SIMILAR PROPERTIES CAROUSEL */}
      {similarProperties.length > 0 && (
        <div className="pt-12 border-t border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Similar Rentals in {property.city}</h2>
              <p className="text-xs text-slate-500 mt-1">Explore other verified options nearby</p>
            </div>
            <Link
              to={`/properties?city=${encodeURIComponent(property.city)}`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              See all in {property.city} &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similarProperties.map((prop) => (
              <PropertyCard key={prop._id} property={prop} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
