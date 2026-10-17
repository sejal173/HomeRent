import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Building, IndianRupee } from 'lucide-react';

export default function SearchBar({ initialCity = '', initialType = '', initialBudget = '', className = '' }) {
  const [city, setCity] = useState(initialCity);
  const [propertyType, setPropertyType] = useState(initialType);
  const [budget, setBudget] = useState(initialBudget);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city && city !== 'All Cities') params.append('city', city);
    if (propertyType && propertyType !== 'All Types') params.append('type', propertyType);
    if (budget && budget !== 'All Budgets') params.append('budget', budget);

    navigate(`/properties?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className={`bg-white rounded-2xl md:rounded-3xl p-3 md:p-4 shadow-elevated border border-slate-200/80 max-w-5xl mx-auto ${className}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        
        {/* Location / City */}
        <div className="md:col-span-4 flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/60 hover:border-slate-300 transition-colors">
          <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="w-full text-left">
            <label htmlFor="search-location" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              City / Location
            </label>
            <select
              id="search-location"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="">All Cities (Bengaluru, Mumbai, etc.)</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Pune">Pune</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Chennai">Chennai</option>
            </select>
          </div>
        </div>

        {/* Property Type */}
        <div className="md:col-span-3 flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/60 hover:border-slate-300 transition-colors">
          <Building className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="w-full text-left">
            <label htmlFor="search-property-type" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Property Type
            </label>
            <select
              id="search-property-type"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="Apartment">Apartment</option>
              <option value="Villa">Villa</option>
              <option value="House">House</option>
              <option value="Studio">Studio</option>
              <option value="PG">PG</option>
            </select>
          </div>
        </div>

        {/* Monthly Budget */}
        <div className="md:col-span-3 flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/60 hover:border-slate-300 transition-colors">
          <IndianRupee className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="w-full text-left">
            <label htmlFor="search-budget-range" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Max Budget
            </label>
            <select
              id="search-budget-range"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="">Any Budget</option>
              <option value="under_25k">Under ₹25,000</option>
              <option value="25k_50k">₹25,000 - ₹50,000</option>
              <option value="50k_100k">₹50,000 - ₹1,00,000</option>
              <option value="above_100k">Above ₹1,00,000</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full h-12 md:h-[52px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Search className="w-4 h-4 stroke-[2.5]" />
            <span>Search</span>
          </button>
        </div>

      </div>
    </form>
  );
}
