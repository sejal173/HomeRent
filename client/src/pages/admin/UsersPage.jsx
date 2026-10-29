// client/src/pages/admin/UsersPage.jsx
// User moderation: search, role filter, suspension status filter, user drawer,
// and secure Suspend/Reactivate actions with mandatory reason.

import React, { useState, useEffect, useCallback } from 'react';
import {
  UserX,
  UserCheck,
  Eye,
  X,
  CheckCircle2,
} from 'lucide-react';
import AdminApi from '../../services/adminApi';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import Pagination from '../../components/admin/Pagination';
import SearchInput from '../../components/admin/SearchInput';
import FilterBar from '../../components/admin/FilterBar';
import { useAuth } from '../../context/AuthContext';

export default function UsersPage() {
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');

  // Sorting
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  // Selected user for drawer
  const [selectedUser, setSelectedUser] = useState(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        role: role || undefined,
        isSuspended: status === 'suspended' ? 'true' : status === 'active' ? 'false' : undefined,
      };
      const res = await AdminApi.getUsers(params);
      setUsers(res.users || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [page, search, role, status]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSort = (field, direction) => {
    setSortField(field);
    setSortDirection(direction);
    // In-memory sort for current table page
    const sorted = [...users].sort((a, b) => {
      let aVal = a[field] || '';
      let bVal = b[field] || '';
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      if (direction === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });
    setUsers(sorted);
  };

  const handleOpenSuspendModal = (user) => {
    setTargetUser(user);
    setDialogOpen(true);
  };

  const handleConfirmSuspension = async (reason) => {
    if (!targetUser) return;
    try {
      setDialogLoading(true);
      const willSuspend = !targetUser.isSuspended;
      await AdminApi.setUserSuspension(targetUser._id, {
        suspend: willSuspend,
        reason,
      });

      setDialogOpen(false);
      setToastMessage(
        willSuspend
          ? `User "${targetUser.name}" has been suspended.`
          : `User "${targetUser.name}" has been reactivated.`
      );
      setTimeout(() => setToastMessage(null), 4000);

      // Refresh list
      fetchUsers();
      if (selectedUser && selectedUser._id === targetUser._id) {
        setSelectedUser((prev) => ({
          ...prev,
          isSuspended: willSuspend,
          suspensionReason: willSuspend ? reason : '',
        }));
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update user suspension state');
    } finally {
      setDialogLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'User',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center uppercase shrink-0">
            {row.name ? row.name.charAt(0) : 'U'}
          </div>
          <div>
            <p className="font-semibold text-slate-900 leading-tight">{row.name}</p>
            <p className="text-[11px] text-slate-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (val) => (
        <span
          className={`capitalize text-xs font-semibold px-2.5 py-1 rounded-full border ${
            val === 'admin'
              ? 'bg-slate-100 text-slate-800 border-slate-300 font-bold'
              : val === 'landlord'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'isSuspended',
      label: 'Status',
      sortable: true,
      render: (val) => <StatusBadge status={val ? 'suspended' : 'active'} />,
    },
    {
      key: 'createdAt',
      label: 'Joined Date',
      sortable: true,
      render: (val) => (
        <span className="text-xs text-slate-500">
          {val ? new Date(val).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (_, row) => {
        const isSelf = currentAdmin?._id === row._id;
        const isOtherAdmin = row.role === 'admin';
        const disabled = isSelf || isOtherAdmin;

        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => setSelectedUser(row)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="View User Details"
            >
              <Eye className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleOpenSuspendModal(row)}
              disabled={disabled}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                disabled
                  ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400'
                  : row.isSuspended
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
              title={
                isSelf
                  ? 'You cannot suspend your own admin account'
                  : isOtherAdmin
                    ? 'Cannot suspend other administrators'
                    : row.isSuspended
                      ? 'Reactivate account'
                      : 'Suspend account'
              }
            >
              {row.isSuspended ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Reactivate</span>
                </>
              ) : (
                <>
                  <UserX className="w-3.5 h-3.5" />
                  <span>Suspend</span>
                </>
              )}
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">User Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit user accounts, roles, access privileges, and account suspensions.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          Total Users: <span className="text-slate-900 font-bold">{total}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <FilterBar
        onReset={() => {
          setSearch('');
          setRole('');
          setStatus('');
          setPage(1);
        }}
      >
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by name or email..."
          className="w-full sm:w-64"
        />

        {/* Role Filter */}
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        >
          <option value="">All Roles</option>
          <option value="tenant">Tenants</option>
          <option value="landlord">Landlords</option>
          <option value="admin">Administrators</option>
        </select>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        >
          <option value="">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="suspended">Suspended Only</option>
        </select>
      </FilterBar>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        error={error}
        onRetry={fetchUsers}
        emptyTitle="No users found"
        emptyMessage="Try adjusting your search criteria or clearing filters."
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      {/* Pagination */}
      <Pagination
        page={page}
        pages={pages}
        total={total}
        onPageChange={(p) => setPage(p)}
      />

      {/* User Details Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center uppercase">
                  {selectedUser.name ? selectedUser.name.charAt(0) : 'U'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedUser.name}</h3>
                  <span className="text-[11px] font-semibold text-blue-600 capitalize">
                    {selectedUser.role} Account
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Account Details
                </p>
                <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Account ID:</span>
                    <span className="font-mono text-slate-800 text-[10px]">{selectedUser._id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-semibold text-slate-900">{selectedUser.email}</span>
                  </div>
                  {selectedUser.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Phone:</span>
                      <span className="font-semibold text-slate-900">{selectedUser.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Status:</span>
                    <StatusBadge status={selectedUser.isSuspended ? 'suspended' : 'active'} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Member Since:</span>
                    <span className="text-slate-700">
                      {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Suspension Reason Warning */}
              {selectedUser.isSuspended && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
                  <p className="font-bold text-rose-800 flex items-center gap-1.5">
                    <UserX className="w-4 h-4" />
                    <span>Suspension Reason</span>
                  </p>
                  <p className="text-rose-700 leading-relaxed">
                    {selectedUser.suspensionReason || 'No specific reason recorded.'}
                  </p>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100"
              >
                Close
              </button>
              {currentAdmin?._id !== selectedUser._id && selectedUser.role !== 'admin' && (
                <button
                  onClick={() => {
                    handleOpenSuspendModal(selectedUser);
                  }}
                  className={`px-4 py-2 rounded-xl font-semibold text-xs ${
                    selectedUser.isSuspended
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {selectedUser.isSuspended ? 'Reactivate User' : 'Suspend User'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suspend / Reactivate Confirmation Modal */}
      <ConfirmDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={targetUser?.isSuspended ? 'Reactivate User Account' : 'Suspend User Account'}
        description={
          targetUser?.isSuspended
            ? `Are you sure you want to reactivate access for "${targetUser?.name}" (${targetUser?.email})? The user will be able to log in and use platform features immediately.`
            : `Are you sure you want to suspend "${targetUser?.name}" (${targetUser?.email})? This user will be immediately logged out and blocked from logging in or using the platform.`
        }
        confirmText={targetUser?.isSuspended ? 'Reactivate Account' : 'Suspend Account'}
        confirmVariant={targetUser?.isSuspended ? 'success' : 'danger'}
        requireReason={!targetUser?.isSuspended} // Reason required ONLY for suspension
        reasonLabel="Administrative Reason for Suspension"
        reasonPlaceholder="e.g. Terms violation, fraudulent contact details, spam behavior..."
        onConfirm={handleConfirmSuspension}
        loading={dialogLoading}
      />
    </div>
  );
}
