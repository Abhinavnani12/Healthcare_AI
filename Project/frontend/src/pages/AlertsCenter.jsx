import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  UserPlus, 
  CheckCircle, 
  Info,
  Clock,
  RefreshCw,
  Bell
} from 'lucide-react';

const AlertsCenter = () => {
  const { refreshInterval } = useAuth();
  
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [staffUsers, setStaffUsers] = useState([]);
  const [assigningAlertId, setAssigningAlertId] = useState(null);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get('/api/alerts', {
        params: {
          search,
          department: deptFilter,
          priority: priorityFilter,
          status: statusFilter
        }
      });
      if (res.data.success) {
        setAlerts(res.data.data);
        setError('');
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setError('Could not retrieve alerts from the server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await axios.get('/api/admin/users?limit=50');
      if (res.data.success) {
        setStaffUsers(res.data.data.list.filter(u => u.isActive));
      }
    } catch (error) {
      setStaffUsers([
        { id: 1, fullName: 'System Admin' },
        { id: 2, fullName: 'Morgan Ellis' },
        { id: 3, fullName: 'Dr. Priya Sharma' },
        { id: 4, fullName: 'Daniel Brooks' }
      ]);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchStaff();
    
    const interval = setInterval(fetchAlerts, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [search, deptFilter, priorityFilter, statusFilter, refreshInterval]);

  const handleResolveAlert = async (id) => {
    try {
      const res = await axios.patch(`/api/alerts/${id}/resolve`);
      if (res.data.success) {
        fetchAlerts();
      }
    } catch (error) {
      alert('Failed to resolve alert');
    }
  };

  const handleAssignAlert = async (alertId, userId) => {
    try {
      const res = await axios.patch(`/api/alerts/${alertId}/assign`, { assignedUserId: userId });
      if (res.data.success) {
        setAssigningAlertId(null);
        fetchAlerts();
      }
    } catch (error) {
      alert('Failed to assign alert');
    }
  };

  // Helper counts
  const openCount = alerts.filter(a => a.status === 'OPEN').length;
  const assignedCount = alerts.filter(a => a.status === 'ASSIGNED').length;
  const resolvedCount = alerts.filter(a => a.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Alerts Incident Command</h1>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">Assign, escalate, and resolve active facility clinical bottlenecks.</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchAlerts(); }}
          className="px-4 py-2 bg-hospital-500 hover:bg-hospital-600 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Sync Incidents</span>
        </button>
      </div>

      {/* Counters Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-between text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Open Issues</span>
          <span className="text-3xl font-extrabold text-red-500 leading-none">{openCount}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-between text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Assigned Staff</span>
          <span className="text-3xl font-extrabold text-amber-500 leading-none">{assignedCount}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-between text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Resolved Today</span>
          <span className="text-3xl font-extrabold text-emerald-500 leading-none">{resolvedCount}</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col xl:flex-row xl:items-center gap-4 shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search alerts title, logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-hospital-500 focus:bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Department */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-600 focus:outline-none"
            >
              <option value="">All Departments</option>
              <option value="ICU">ICU</option>
              <option value="Emergency">Emergency</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Facilities">Facilities</option>
              <option value="General Medicine">General Medicine</option>
            </select>
          </div>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-600 focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-600 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>
      </div>

      {/* Incident List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-12 text-slate-400 font-semibold">
            Refreshing incidents...
          </div>
        ) : alerts.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-3xl">
            No active incidents matching your criteria.
          </div>
        ) : (
          alerts.map((alt) => (
            <div 
              key={alt.id} 
              className={`
                bg-white border rounded-3xl p-5 flex flex-col justify-between transition-card shadow-sm
                ${alt.status === 'RESOLVED' ? 'opacity-60 border-slate-100' : 'border-slate-200'}
              `}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full uppercase
                    ${alt.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                      alt.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                      alt.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}
                  `}>
                    {alt.priority}
                  </span>
                  
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase
                    ${alt.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 
                      alt.status === 'ASSIGNED' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}
                  `}>
                    {alt.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">{alt.title}</h3>
                <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-semibold mb-3">
                  <span>{alt.department}</span>
                  <span>•</span>
                  <Clock className="h-3.5 w-3.5" />
                  <span>{new Date(alt.createdAt).toLocaleString()}</span>
                </div>

                <p className="text-xs text-slate-600 mb-4 leading-normal">{alt.description}</p>

                {alt.recommendedAction && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 text-xs">
                    <div className="flex items-center space-x-1 text-slate-700 font-bold mb-1">
                      <Info className="h-4 w-4 text-hospital-500" />
                      <span>Recommended Action</span>
                    </div>
                    <p className="text-slate-600 leading-normal italic">{alt.recommendedAction}</p>
                  </div>
                )}
              </div>

              {alt.status !== 'RESOLVED' && (
                <div className="border-t border-slate-100 pt-4 flex space-x-2">
                  {alt.status === 'OPEN' ? (
                    <div className="relative flex-1">
                      <button
                        onClick={() => setAssigningAlertId(assigningAlertId === alt.id ? null : alt.id)}
                        className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-1"
                      >
                        <UserPlus className="h-4 w-4 text-slate-400" />
                        <span>Assign Staff</span>
                      </button>

                      {assigningAlertId === alt.id && (
                        <div className="absolute left-0 bottom-10 z-50 w-full bg-white border border-slate-200 rounded-2xl shadow-xl max-h-40 overflow-y-auto p-1.5">
                          {staffUsers.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => handleAssignAlert(alt.id, s.id)}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 font-semibold rounded-lg"
                            >
                              {s.fullName} ({s.role})
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 py-2 text-center text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-xl">
                      Assigned to: <span className="font-bold text-slate-700">{alt.user?.fullName}</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleResolveAlert(alt.id)}
                    className="flex-1 py-2 bg-hospital-500 hover:bg-hospital-600 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Mark Resolved</span>
                  </button>
                </div>
              )}

              {alt.status === 'RESOLVED' && alt.resolvedAt && (
                <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-400 font-semibold italic text-right">
                  Resolved at {new Date(alt.resolvedAt).toLocaleString()}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsCenter;
