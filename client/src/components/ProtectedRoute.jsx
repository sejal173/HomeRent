// client/src/components/ProtectedRoute.jsx
// Guards routes that require login or specific roles (e.g., Landlords only).

import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogIn, ArrowLeft } from 'lucide-react';

export default function ProtectedRoute({ children, landlordOnly = false }) {
  const { isAuthenticated, isLandlord } = useAuth();
  const location = useLocation();

  // 1. If not logged in, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. If route is landlord-only, verify user role
  if (landlordOnly && !isLandlord) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 stroke-[2]" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Landlords Only</h1>
        <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
          Posting and editing properties is reserved for landlord accounts. You are currently signed in as a tenant.
        </p>
        <div className="flex gap-3">
          <Link
            to="/dashboard"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Link>
          <Link
            to="/login"
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 shadow-sm"
          >
            <LogIn className="w-4 h-4" />
            <span>Switch Account</span>
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
