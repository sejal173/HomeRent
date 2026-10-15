import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Mail, Phone, MapPin, ShieldCheck, Heart, Sparkles } from 'lucide-react';

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
              Discover verified rental properties, modern apartments, villas, and family houses across top tech hubs. Built with the full MERN stack for speed, reliability, and ease of use.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Verified Property Listings & Secure Authentication</span>
            </div>
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
                <Link to="/dashboard" className="hover:text-blue-400 transition-colors">Analytics & Stats</Link>
              </li>
              <li>
                <Link to="/add-property" className="hover:text-blue-400 transition-colors">Post Property Listing</Link>
              </li>
            </ul>
          </div>

          {/* Popular Cities */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Top Cities</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/properties?city=Bengaluru" className="hover:text-blue-400 transition-colors">Bengaluru</Link>
              </li>
              <li>
                <Link to="/properties?city=Mumbai" className="hover:text-blue-400 transition-colors">Mumbai</Link>
              </li>
              <li>
                <Link to="/properties?city=Delhi NCR" className="hover:text-blue-400 transition-colors">Delhi NCR</Link>
              </li>
              <li>
                <Link to="/properties?city=Pune" className="hover:text-blue-400 transition-colors">Pune</Link>
              </li>
              <li>
                <Link to="/properties?city=Hyderabad" className="hover:text-blue-400 transition-colors">Hyderabad</Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Developer & Contact</h4>
            <div className="space-y-3 text-sm text-slate-400">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="truncate">support@homerent.dev</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Tech Park Road, Bengaluru, Karnataka</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} HomeRent Platform. Built with React.js, Tailwind CSS, Node.js & MongoDB.</p>
          <div className="flex items-center gap-6">
            <span>Portfolio Full-Stack Demonstration Project</span>
            <span className="flex items-center gap-1 text-slate-400">
              Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> for fresher developer interviews
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
