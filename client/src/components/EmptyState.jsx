import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';

export default function EmptyState({
  title = "No properties found",
  message = "We couldn't find any rental properties matching your current filter criteria. Try adjusting your search or clearing filters.",
  onReset
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center max-w-xl mx-auto shadow-sm my-8">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
        <SearchX className="w-8 h-8 stroke-[1.8]" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed mb-6">{message}</p>
      {onReset && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset All Filters</span>
        </button>
      )}
    </div>
  );
}
