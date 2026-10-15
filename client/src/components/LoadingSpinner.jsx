import React from 'react';

export function LoadingSpinner({ text = 'Loading listings...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="relative w-12 h-12">
        <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-600 animate-pulse">{text}</p>
    </div>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-[16/10] bg-slate-200" />
      <div className="p-5 space-y-3">
        <div className="h-6 bg-slate-200 rounded w-1/3" />
        <div className="h-5 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-100 rounded w-1/2" />
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100">
          <div className="h-4 bg-slate-100 rounded" />
          <div className="h-4 bg-slate-100 rounded" />
          <div className="h-4 bg-slate-100 rounded" />
        </div>
        <div className="h-4 bg-slate-100 rounded w-1/4 pt-2" />
      </div>
    </div>
  );
}
