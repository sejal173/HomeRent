// client/src/components/admin/DataTable.jsx
// Flexible data table with sortable columns, loading skeletons, empty & error-with-retry states.

import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, AlertCircle, RefreshCw } from 'lucide-react';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  error = null,
  onRetry = null,
  emptyTitle = 'No records found',
  emptyMessage = 'There are no items matching the selected filters.',
  sortField = null,
  sortDirection = 'desc',
  onSort = null,
  keyExtractor = (row, i) => row._id || row.id || i,
}) {
  const handleHeaderClick = (col) => {
    if (!col.sortable || !onSort) return;
    if (sortField === col.key) {
      onSort(col.key, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(col.key, 'desc');
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-3.5 px-4 select-none ${col.className || ''} ${
                    col.sortable ? 'cursor-pointer hover:text-slate-900 transition-colors' : ''
                  }`}
                  onClick={() => handleHeaderClick(col)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.label}</span>
                    {col.sortable && (
                      <span className="text-slate-400">
                        {sortField === col.key ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                  {columns.map((col, cIdx) => (
                    <td key={`skel-col-${cIdx}`} className="py-4 px-4">
                      <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              // Error state with retry
              <tr>
                <td colSpan={columns.length} className="py-12 text-center px-4">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">Failed to load data</p>
                    <p className="text-xs text-slate-500 mb-4">{error}</p>
                    {onRetry && (
                      <button
                        onClick={onRetry}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Try Again</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={columns.length} className="py-14 text-center px-4">
                  <p className="text-sm font-semibold text-slate-800">{emptyTitle}</p>
                  <p className="text-xs text-slate-500 mt-1">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              // Real data rows
              data.map((row, idx) => (
                <tr
                  key={keyExtractor(row, idx)}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={`${keyExtractor(row, idx)}-${col.key}`}
                      className={`py-3.5 px-4 text-slate-700 ${col.className || ''}`}
                    >
                      {col.render ? col.render(row[col.key], row, idx) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
