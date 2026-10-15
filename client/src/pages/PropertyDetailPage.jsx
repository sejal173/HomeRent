import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Heart, MapPin, Bed, Bath, Sparkles, ShieldCheck, CheckCircle2, 
  Share2, Phone, Mail, ArrowLeft, Send, CheckCircle, Award
} from 'lucide-react';
import { PropertyService } from '../services/api';
import { useSaved } from '../context/SavedContext';
import PropertyCard from '../components/PropertyCard';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const { isSaved, toggleSave } = useSaved();
  const [property, setProperty] = useState(null);
  const [similarProperties, setSimilarProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Inquiry form states: only Name, Phone, and Message
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('Hello, I am interested in this rental property and would like to arrange a site visit.');
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await PropertyService.getById(id);
        if (res.success && res.property) {
          setProperty(res.property);
          setActiveImageIndex(0);

          // Fetch similar listings in same city
          const simRes = await PropertyService.getAll({
            city: res.property.city,
            limit: 3
          });
          if (simRes.success) {
            setSimilarProperties(simRes.properties.filter(p => p._id !== res.property._id).slice(0, 3));
          }
        }
      } catch (err) {
        console.error('Failed to load property details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    setInquirySubmitted(true);
    setTimeout(() => {
      setInquirySubmitted(false);
      setInquiryName('');
      setInquiryPhone('');
    }, 4000);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return <LoadingSpinner text="Loading property details..." />;
  }

  if (!property) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Property not found</h2>
        <Link to="/properties" className="mt-4 inline-block text-blue-600 font-semibold">
          &larr; Back to Listings
        </Link>
      </div>
    );
  }

  const saved = isSaved(property._id);
  const formattedRent = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(property.monthlyRent);

  const securityDeposit = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(property.monthlyRent * 2);

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
              {property.propertyType}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                property.availabilityStatus === 'Available'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              ● {property.availabilityStatus}
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
            <span>{property.address || `${property.area}, ${property.city}`}</span>
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
            src={property.images?.[activeImageIndex] || property.images?.[0]}
            alt={property.title}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80';
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
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80';
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
              <div className="text-sm font-bold text-slate-900">{property.bedrooms} BHK</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">
              <Bath className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
              <div className="text-xs text-slate-500">Bathrooms</div>
              <div className="text-sm font-bold text-slate-900">{property.bathrooms} Baths</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">
              <Sparkles className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
              <div className="text-xs text-slate-500">Furnishing</div>
              <div className="text-sm font-bold text-slate-900 truncate">{property.furnishingStatus}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">
              <ShieldCheck className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
              <div className="text-xs text-slate-500">Listed By</div>
              <div className="text-sm font-bold text-slate-900 truncate">{property.ownerName || 'Verified Owner'}</div>
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
                <span className="font-bold text-slate-900 block text-sm mb-1">{property.area}, {property.city}</span>
                Situated in prime residential locality with seamless connectivity to tech corridors, metro stations, grocery supermarkets, and educational institutions.
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
                {(property.ownerName || 'V').charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-slate-900 text-base">{property.ownerName || 'Landlord'}</h3>
                  <Award className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-xs text-slate-500">Verified Property Owner</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{property.ownerEmail || 'owner@testrent.com'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{property.ownerPhone || '+91 98765 43210'}</span>
              </div>
            </div>
          </div>

          {/* Interactive Inquiry Form */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-card space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Schedule Visit / Inquiry
            </h3>
            <p className="text-xs text-slate-500 leading-normal">
              Send your preferred move-in date and contact number directly to the owner.
            </p>

            {inquirySubmitted ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-2 animate-in fade-in">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm">Inquiry Sent Successfully!</h4>
                <p className="text-xs text-emerald-700">
                  The property owner has received your contact details and will call or message you shortly.
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
                    placeholder="e.g. Rahul Sharma"
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

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Message
                  </label>
                  <textarea
                    rows={3}
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide uppercase flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all hover:scale-[1.01]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Rental Request</span>
                </button>
              </form>
            )}
          </div>

        </div>

      </div>

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
