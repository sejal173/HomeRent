import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Mail, Lock, LogIn, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      login(email, password);
      setLoading(false);
      navigate('/dashboard');
    }, 400);
  };

  const handleDemoFill = (role = 'tenant') => {
    if (role === 'owner') {
      setEmail('vikram.malhotra@testrent.com');
      setPassword('password123');
    } else {
      setEmail('rahul.renter@testrent.com');
      setPassword('password123');
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

        {/* Demo Credentials Quick-Fill helper */}
        <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-slate-700">
          <div className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>Quick-Fill Demo Credentials:</span>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => handleDemoFill('tenant')}
              className="flex-1 py-1 px-2 rounded-lg bg-white border border-blue-200 text-blue-700 font-medium hover:bg-blue-50 transition-colors"
            >
              As Tenant
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('owner')}
              className="flex-1 py-1 px-2 rounded-lg bg-white border border-blue-200 text-blue-700 font-medium hover:bg-blue-50 transition-colors"
            >
              As Landlord
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Form */}
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

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
              <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4" />
              <span>Remember me</span>
            </label>
            <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-blue-600 hover:underline">
              Forgot password?
            </a>
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
