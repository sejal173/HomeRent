// client/src/pages/admin/OverviewPage.jsx
// Platform Overview with 12 real-time metric cards, interactive Recharts graphs,
// and recent registration/listing/report activity feeds.

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  UserCheck,
  UserX,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import AdminApi from '../../services/adminApi';
import StatCard from '../../components/admin/StatCard';
import StatusBadge from '../../components/admin/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

const PIE_COLORS = ['#10B981', '#F59E0B', '#F43F5E', '#64748B'];

export default function OverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await AdminApi.getDashboard();
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="text-xs font-semibold text-slate-500 mt-4">Loading platform analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Unable to load dashboard</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">{error}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  const { metrics, trends, distributions, recentActivity } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">System Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time platform metrics, user growth, property status, and safety signals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Database Sync
          </span>
        </div>
      </div>

      {/* 12 Core Metric Cards (Item 4 Spec) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* 1. Total Users */}
        <StatCard
          title="Total Users"
          value={metrics.totalUsers}
          icon={Users}
          color="blue"
          subtitle="All platform accounts"
        />
        {/* 2. Total Owners (Landlords) */}
        <StatCard
          title="Total Owners (Landlords)"
          value={metrics.totalLandlords}
          icon={UserCheck}
          color="blue"
          subtitle="Registered property owners"
        />
        {/* 3. Total Tenants */}
        <StatCard
          title="Total Tenants"
          value={metrics.totalTenants}
          icon={Users}
          color="slate"
          subtitle="Registered home seekers"
        />
        {/* 4. Total Properties */}
        <StatCard
          title="Total Properties"
          value={metrics.totalProperties}
          icon={Building2}
          color="slate"
          subtitle="All platform listings"
        />

        {/* 5. Pending Approvals */}
        <StatCard
          title="Pending Approvals"
          value={metrics.pendingProperties}
          icon={Clock}
          color="amber"
          subtitle="Awaiting admin review"
        />
        {/* 6. Approved Properties */}
        <StatCard
          title="Approved Properties"
          value={metrics.approvedProperties}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Publicly live listings"
        />
        {/* 7. Rejected Properties */}
        <StatCard
          title="Rejected Properties"
          value={metrics.rejectedProperties}
          icon={XCircle}
          color="rose"
          subtitle="Declined submissions"
        />
        {/* 8. Suspended Users */}
        <StatCard
          title="Suspended Users"
          value={metrics.totalSuspendedUsers}
          icon={UserX}
          color="rose"
          subtitle="Restricted account access"
        />

        {/* 9. Pending Reports */}
        <StatCard
          title="Pending Reports"
          value={metrics.pendingReports}
          icon={AlertTriangle}
          color="amber"
          subtitle="Safety review backlog"
        />
        {/* 10. Pending Verifications */}
        <StatCard
          title="Pending Verifications"
          value={metrics.pendingVerifications}
          icon={ShieldCheck}
          color="blue"
          subtitle="Deed submissions in review"
        />
        {/* 11. Total Visit Requests */}
        <StatCard
          title="Total Visit Requests"
          value={metrics.totalVisitRequests}
          icon={Calendar}
          color="slate"
          subtitle="Scheduled tenant visits"
        />
        {/* 12. Total Reviews */}
        <StatCard
          title="Total Reviews"
          value={metrics.totalReviews}
          icon={Star}
          color="amber"
          subtitle="Tenant feedback & ratings"
        />
      </div>

      {/* Visual Analytics Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registrations Trend */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">User Registrations (Last 30 Days)</h3>
              <p className="text-xs text-slate-400">Daily new account signups</p>
            </div>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="h-64">
            {trends.userRegistrations && trends.userRegistrations.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends.userRegistrations} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#userGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No registration trend data recorded in this period.
              </div>
            )}
          </div>
        </div>

        {/* Listings Trend */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">New Listings (Last 30 Days)</h3>
              <p className="text-xs text-slate-400">Daily submitted property listings</p>
            </div>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="h-64">
            {trends.propertyListings && trends.propertyListings.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends.propertyListings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No listing submissions in the past 30 days.
              </div>
            )}
          </div>
        </div>

        {/* Approval Distribution */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Approval Status Distribution</h3>
          <p className="text-xs text-slate-400 mb-4">Breakdown of platform moderation states</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributions.approvalStatus || []}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={4}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(distributions.approvalStatus || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Property Types */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Listings by Property Type</h3>
          <p className="text-xs text-slate-400 mb-4">Inventory mix across property categories</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={distributions.types || []}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis dataKey="type" type="category" tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#6366F1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Registrations */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Recent Users</h3>
            <Link to="/admin/users" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3 flex-1">
            {recentActivity.users?.map((u) => (
              <div key={u._id} className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="truncate max-w-[150px]">
                  <p className="font-semibold text-slate-800 truncate">{u.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="capitalize text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {u.role}
                  </span>
                  <StatusBadge status={u.isSuspended ? 'suspended' : 'active'} size="xs" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Properties */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Recent Properties</h3>
            <Link to="/admin/properties" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3 flex-1">
            {recentActivity.properties?.map((p) => (
              <div key={p._id} className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="truncate max-w-[150px]">
                  <p className="font-semibold text-slate-800 truncate">{p.title}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {p.city} · ₹{p.price?.toLocaleString()}/mo
                  </p>
                </div>
                <StatusBadge status={p.approvalStatus || 'pending'} size="xs" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Safety Reports</h3>
            <Link to="/admin/reports" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3 flex-1">
            {recentActivity.reports?.length > 0 ? (
              recentActivity.reports.map((r) => (
                <div key={r._id} className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="truncate max-w-[150px]">
                    <p className="font-semibold text-slate-800 truncate capitalize">{r.category?.replace(/_/g, ' ')}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {r.property?.title || 'Property listing'}
                    </p>
                  </div>
                  <StatusBadge status={r.status} size="xs" />
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 py-8">
                No safety reports currently active.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
