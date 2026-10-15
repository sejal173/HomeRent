import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
          
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                <Home className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">
                Home<span className="text-blue-500">Rent</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Find rental apartments, villas and family homes in Pune and other top cities.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Quick Navigation</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-blue-400 transition-colors">Home Page</Link>
              </li>
              <li>
                <Link to="/properties" className="hover:text-blue-400 transition-colors">Browse Properties</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-blue-400 transition-colors">Dashboard</Link>
              </li>
              <li>
                <Link to="/add-property" className="hover:text-blue-400 transition-colors">List Your Property</Link>
              </li>
            </ul>
          </div>

          {/* Top Cities */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Top Cities</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/properties?city=Pune" className="hover:text-blue-400 transition-colors">Pune</Link>
              </li>
              <li>
                <Link to="/properties?city=Mumbai" className="hover:text-blue-400 transition-colors">Mumbai</Link>
              </li>
              <li>
                <Link to="/properties?city=Bengaluru" className="hover:text-blue-400 transition-colors">Bengaluru</Link>
              </li>
              <li>
                <Link to="/properties?city=Hyderabad" className="hover:text-blue-400 transition-colors">Hyderabad</Link>
              </li>
              <li>
                <Link to="/properties?city=Delhi NCR" className="hover:text-blue-400 transition-colors">Delhi NCR</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Contact</h4>
            <div className="space-y-3 text-sm text-slate-400">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <a href="mailto:support@homerent.dev" className="hover:text-blue-400 transition-colors truncate">
                  support@homerent.dev
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <a href="tel:+915678356256" className="hover:text-blue-400 transition-colors">
                  +91 56783 56256
                </a>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Hinjawadi Phase 1, Pune, Maharashtra</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 HomeRent. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
