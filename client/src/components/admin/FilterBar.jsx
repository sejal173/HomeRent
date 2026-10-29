// client/src/components/admin/FilterBar.jsx
// Standardized filter container with responsive layout and optional reset button.

import React from 'react';
import { RotateCcw } from 'lucide-react';

export default function FilterBar({ children, onReset, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm ${className}`}>
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        {children}
      </div>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
}
