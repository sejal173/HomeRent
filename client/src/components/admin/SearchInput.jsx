// client/src/components/admin/SearchInput.jsx
// Debounced search input with clear icon.

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchInput({
  value: initialValue = '',
  onChange,
  placeholder = 'Search records...',
  debounceMs = 350,
  className = '',
}) {
  const [innerValue, setInnerValue] = useState(initialValue);

  useEffect(() => {
    setInnerValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (innerValue !== initialValue) {
        onChange(innerValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [innerValue, debounceMs, initialValue, onChange]);

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
      <input
        type="text"
        value={innerValue}
        onChange={(e) => setInnerValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200/90 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm"
      />
      {innerValue && (
        <button
          type="button"
          onClick={() => {
            setInnerValue('');
            onChange('');
          }}
          className="absolute right-2.5 p-0.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
