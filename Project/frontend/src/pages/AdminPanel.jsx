import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Search, 
  Filter, 
  ShieldCheck, 
  Check, 
  X, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

const AdminPanel = () => {
  const { refreshInterval, user: currentUser } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals / Confirmations
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newRole, setNewRole] = useState('OPERATIONS_HEAD');
  const [statusToToggle, setStatusToToggle] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users', {
        params: {
          search,
          role: roleFilter,
          status: statusFilter,
          page,
          limit
        }
      });
      if (res.data.success) {
        setUsers(res.data.data.list);
        setTotal(res.data.data.pagination.total);
        setTotalPages(res.data.data.pagination.totalPages);
        setError('');
      }
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
      setError('Could not retrieve registered users. You must be an administrator.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter, page]);

  const handleOpenRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const handleOpenStatusModal = (user) => {
    setSelectedUser(user);
    setStatusToToggle(!user.isActive);
    setShowStatusModal(true);
  };

  const handleUpdateRoleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.patch(`/api/admin/users/${selectedUser.id}/role`, { role: newRole });
      if (res.data.success) {
        setShowRoleModal(false);
        setSuccess('User role updated successfully!');
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleUpdateStatusSubmit = async () => {
    try {
      const res = await axios.patch(`/api/admin/users/${selectedUser.id}/status`, { isActive: statusToToggle });
      if (res.data.success) {
        setShowStatusModal(false);
        setSuccess(`Account has been successfully ${statusToToggle ? 'activated' : 'deactivated'}!`);
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle account status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">System User Administration</h1>
        <p className="text-sm text-slate-500 mt-0.5 font-medium">Verify credentials, configure access levels, and toggle security statuses.</p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center space-x-2.5 text-sm">
          <Check className="h-5 w-5 text-emerald-600" />
          <span className="font-semibold">{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-start space-x-2 text-sm">
          <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col xl:flex-row xl:items-center gap-4 shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Role */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-600 focus:outline-none"
            >
              <option value="">All Access Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="CEO">CEO</option>
              <option value="CMO">CMO</option>
              <option value="OPERATIONS_HEAD">OPERATIONS_HEAD</option>
            </select>
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-600 focus:outline-none"
          >
            <option value="">All Account Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="inactive">Deactivated Accounts</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">System Access Role</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                    Syncing user log files...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-900">{u.fullName}</td>
                    <td className="px-6 py-4 text-slate-500">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 text-[9px] font-bold bg-blue-50 text-hospital-600 rounded-full border border-blue-100 uppercase">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase
                        ${u.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}
                      `}>
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenRoleModal(u)}
                          disabled={u.id === currentUser?.id}
                          className="px-2.5 py-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-[10px] rounded-lg disabled:opacity-50 transition-colors"
                        >
                          Modify Role
                        </button>
                        <button
                          onClick={() => handleOpenStatusModal(u)}
                          disabled={u.id === currentUser?.id}
                          className={`
                            px-2.5 py-1 text-[10px] font-semibold rounded-lg disabled:opacity-50 transition-colors
                            ${u.isActive 
                              ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-100' 
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100'}
                          `}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Showing <span className="font-semibold">{users.length}</span> of <span className="font-semibold">{total}</span> users
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg disabled:opacity-50 text-slate-600"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg disabled:opacity-50 text-slate-600"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODIFY ROLE MODAL ================= */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowRoleModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:bg-slate-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
              <ShieldCheck className="h-5 w-5 mr-2 text-hospital-500" />
              Modify Access Role
            </h2>
            <p className="text-xs text-slate-500 leading-normal mb-4">
              Select the new security and navigation role for <span className="font-bold text-slate-800">{selectedUser?.fullName}</span>.
            </p>

            <form onSubmit={handleUpdateRoleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Security Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="ADMIN">ADMIN (Full Panel Control)</option>
                  <option value="CEO">CEO (Finance & Strategy)</option>
                  <option value="CMO">CMO (Clinical Operations)</option>
                  <option value="OPERATIONS_HEAD">OPERATIONS_HEAD (Logistics & Alerts)</option>
                </select>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-hospital-500 hover:bg-hospital-600 text-white font-bold text-xs rounded-xl"
                >
                  Update Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= TOGGLE STATUS MODAL ================= */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-center">
            <div className={`mx-auto h-12 w-12 rounded-2xl flex items-center justify-center mb-4
              ${statusToToggle ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}
            `}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              {statusToToggle ? 'Activate Operational Account' : 'Deactivate Operational Account'}
            </h2>
            <p className="text-xs text-slate-500 leading-normal mb-6">
              Are you sure you want to {statusToToggle ? 'ACTIVATE' : 'DEACTIVATE'} access permissions for <span className="font-bold text-slate-800">{selectedUser?.fullName}</span>?
              {!statusToToggle && ' This will restrict this user from logging in or performing actions.'}
            </p>

            <div className="flex space-x-2">
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatusSubmit}
                className={`flex-1 py-2.5 text-white font-bold text-xs rounded-xl
                  ${statusToToggle ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
                `}
              >
                Confirm Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
