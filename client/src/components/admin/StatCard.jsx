// client/src/components/admin/StatCard.jsx
// Metric display card matching existing HomeRent design tokens.

import React from 'react';

const colorMap = {
  blue: {
    bg: 'bg-blue-50 text-blue-600 border-blue-100',
    accent: 'text-blue-600',
  },
  emerald: {
    bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    accent: 'text-emerald-600',
  },
  amber: {
    bg: 'bg-amber-50 text-amber-600 border-amber-100',
    accent: 'text-amber-600',
  },
  rose: {
    bg: 'bg-rose-50 text-rose-600 border-rose-100',
    accent: 'text-rose-600',
  },
  slate: {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    accent: 'text-slate-700',
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
}) {
  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {value !== undefined && value !== null ? value.toLocaleString() : '—'}
            </h4>
            {trend && (
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {trend}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${scheme.bg}`}>
            <Icon className="w-5 h-5 stroke-[2]" />
          </div>
        )}
      </div>
    </div>
  );
}
