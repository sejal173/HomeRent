// client/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Query params for suspension reason or redirect
  const searchParams = new URLSearchParams(location.search);
  const isSuspendedRedirect = searchParams.get('suspended') === 'true';

  // Rule 3.1: redirectParam accepts only internal paths (starts with a single "/", not "//", no protocol, no backslash)
  const isValidInternalPath = (path) => {
    if (!path || typeof path !== 'string') return false;
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\') || path.includes(':')) {
      return false;
    }
    return true;
  };

  const rawRedirect = searchParams.get('redirect');
  const validRedirect = isValidInternalPath(rawRedirect) ? rawRedirect : null;
  const stateFrom = isValidInternalPath(location.state?.from?.pathname) ? location.state.from.pathname : null;
  const from = validRedirect || stateFrom || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      const destination = loggedUser?.role === 'admin' && from === '/dashboard' ? '/admin' : from;
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-card">
        
        {/* Top Logo & Title */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/20">
            <Home className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
            Sign in to Home<span className="text-blue-600">Rent</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Access your saved listings, inquiries, and rental dashboard
          </p>
        </div>

        {/* Rule 3.2: Fixed suspension message, reason only from router state or API response */}
        {isSuspendedRedirect && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
            <p className="font-bold">Account Suspended</p>
            <p className="text-amber-700 leading-relaxed">
              Your account has been administratively suspended.
              {location.state?.suspensionReason ? ` Reason: ${location.state.suspensionReason}` : ' Please contact support if you believe this is in error.'}
            </p>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 transition-all disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-blue-600 hover:underline">
            Register for free
          </Link>
        </div>

      </div>
    </div>
  );
}
