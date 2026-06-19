import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Activity, 
  AlertTriangle, 
  Users, 
  DollarSign, 
  Bell, 
  Settings as SettingsIcon, 
  ShieldAlert, 
  FileText, 
  Menu, 
  X, 
  Search, 
  RefreshCw, 
  User, 
  ChevronRight, 
  ShieldCheck, 
  Cpu 
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout, persona, setPersona, getAllowedPersonas, refreshInterval } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());
  const [searchQuery, setSearchQuery] = useState('');
  const [staffUsers, setStaffUsers] = useState([]);
  const [assigningAlertId, setAssigningAlertId] = useState(null);

  // Nav items list
  const navItems = [
    { name: 'Hospital Executive Dashboard', path: '/', icon: LayoutDashboard, roles: ['ADMIN', 'CEO', 'OPERATIONS_HEAD'] },
    { name: 'ICU Operations', path: '/icu', icon: Activity, roles: ['ADMIN', 'CMO', 'OPERATIONS_HEAD'] },
    { name: 'Emergency Room', path: '/emergency', icon: ShieldAlert, roles: ['ADMIN', 'CMO', 'OPERATIONS_HEAD'] },
    { name: 'Patient Journey', path: '/patient-journey', icon: Users, roles: ['ADMIN', 'CMO', 'OPERATIONS_HEAD'] },
    { name: 'Doctor Productivity', path: '/doctor-productivity', icon: FileText, roles: ['ADMIN', 'CMO'] },
    { name: 'Hospital Financial Dashboard', path: '/financial', icon: DollarSign, roles: ['ADMIN', 'CEO'] },
    { name: 'Alerts Center', path: '/alerts', icon: AlertTriangle, roles: ['ADMIN', 'CMO', 'OPERATIONS_HEAD'] },
    { name: 'Reports', path: '/reports', icon: FileText, roles: ['ADMIN', 'CEO', 'CMO', 'OPERATIONS_HEAD'] },
    { name: 'Settings', path: '/settings', icon: SettingsIcon, roles: ['ADMIN', 'CEO', 'CMO', 'OPERATIONS_HEAD'] },
  ];

  // Admin link addition
  if (user?.role === 'ADMIN') {
    navItems.push({ name: 'Admin Panel', path: '/admin', icon: ShieldCheck, roles: ['ADMIN'] });
  }

  // Filter nav items based on user role
  const allowedNavItems = navItems.filter(item => item.roles.includes(user?.role));

  const fetchAlertsAndInsights = async () => {
    if (!user) return;
    setLoadingAlerts(true);
    try {
      // Fetch alerts
      const alertsRes = await axios.get('/api/alerts');
      if (alertsRes.data.success) {
        setAlerts(alertsRes.data.data.filter(a => a.status !== 'RESOLVED'));
      }

      // Fetch AI insights from executive summary or database
      const execRes = await axios.get('/api/dashboard/executive');
      if (execRes.data.success) {
        setAiInsights(execRes.data.data.aiInsights || []);
      }
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (error) {
      console.error('Failed to sync layout alerts:', error);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const fetchStaff = async () => {
    if (user?.role === 'ADMIN' || user?.role === 'CMO' || user?.role === 'OPERATIONS_HEAD') {
      try {
        const res = await axios.get('/api/admin/users?limit=50');
        if (res.data.success) {
          setStaffUsers(res.data.data.list.filter(u => u.isActive));
        }
      } catch (error) {
        // Fallback staff list if route not accessible (e.g. CMO cannot view admin/users page, but can query staff)
        setStaffUsers([
          { id: 1, fullName: 'System Admin' },
          { id: 2, fullName: 'Morgan Ellis' },
          { id: 3, fullName: 'Dr. Priya Sharma' },
          { id: 4, fullName: 'Daniel Brooks' }
        ]);
      }
    }
  };

  useEffect(() => {
    fetchAlertsAndInsights();
    fetchStaff();
    
    // Set polling interval
    const interval = setInterval(() => {
      fetchAlertsAndInsights();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [user, refreshInterval]);

  const handleResolveAlert = async (id) => {
    try {
      const res = await axios.patch(`/api/alerts/${id}/resolve`);
      if (res.data.success) {
        fetchAlertsAndInsights();
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
        fetchAlertsAndInsights();
      }
    } catch (error) {
      alert('Failed to assign alert');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/patient-journey?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getUserInitials = () => {
    if (!user) return '??';
    const parts = user.fullName.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.fullName.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Mobile Header Bar */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-hospital-500" />
          <span className="font-bold text-slate-900 tracking-tight text-lg">NORTHSTAR</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 rounded-md text-slate-500 hover:bg-slate-100"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:h-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* Sidebar Brand Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8 text-hospital-500" />
              <div>
                <h1 className="font-bold text-slate-900 leading-none text-xl tracking-tight">NORTHSTAR</h1>
                <span className="text-xs font-semibold text-slate-500">Command Center</span>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-slate-500 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {allowedNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-150
                    ${isActive 
                      ? 'bg-blue-50 text-hospital-500' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-hospital-500' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Secure Session footer card */}
          <div className="p-4 border-t border-slate-200">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs">
              <div className="flex items-center space-x-2 text-hospital-500 font-semibold mb-1">
                <ShieldCheck className="h-4 w-4" />
                <span>Secure Session</span>
              </div>
              <p className="text-slate-500 leading-normal mb-1">Role-based access active. Authenticated as <span className="font-semibold text-slate-700">{user?.role}</span>.</p>
              <p className="text-slate-400">Patient identifiers are masked in operational views.</p>
            </div>
            
            <button 
              onClick={logout}
              className="mt-3 w-full px-4 py-2 text-center text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors"
            >
              Log Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto lg:h-screen">
          {/* Top Header */}
          <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Northstar Medical Center</h2>
                <div className="flex items-center text-xs text-emerald-600 font-semibold space-x-1.5 mt-0.5">
                  <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span>Data feeds connected</span>
                  <span className="text-slate-400 font-normal">| Last updated: {lastUpdated}</span>
                </div>
              </div>
              
              <button 
                onClick={fetchAlertsAndInsights}
                disabled={loadingAlerts}
                className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 transition-colors"
                title="Manual Sync"
              >
                <RefreshCw className={`h-4 w-4 ${loadingAlerts ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Search and User Switchers */}
            <div className="flex flex-wrap items-center gap-3">
              <form onSubmit={handleSearchSubmit} className="relative w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patients, doctors, alerts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-hospital-500 focus:bg-white transition-all"
                />
              </form>

              {/* Persona Switcher */}
              <div className="bg-slate-100 p-1 rounded-xl flex space-x-1 text-xs font-semibold">
                {getAllowedPersonas.map((p) => {
                  const isSelected = persona === p.key;
                  return (
                    <button
                      key={p.key}
                      onClick={() => setPersona(p.key)}
                      className={`
                        px-3 py-1.5 rounded-lg transition-all duration-150
                        ${isSelected 
                          ? 'bg-hospital-500 text-white shadow-sm' 
                          : 'text-slate-600 hover:text-slate-900'}
                      `}
                    >
                      {p.key === 'OPERATIONS_HEAD' ? 'Operations Head' : p.key === 'CMO' ? 'CMO' : 'CEO'}
                    </button>
                  );
                })}
              </div>

              {/* User Profile avatar */}
              <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-xl p-1.5 pr-3">
                <div className="h-8 w-8 rounded-lg bg-hospital-500 text-white flex items-center justify-center font-bold text-sm">
                  {getUserInitials()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight">{user?.fullName}</div>
                  <div className="text-[10px] text-slate-400 font-semibold">{user?.role} view</div>
                </div>
              </div>
            </div>
          </header>

          {/* Child content area */}
          <div className="flex-1 flex flex-col xl:flex-row overflow-x-hidden">
            {/* Inner Dashboard View */}
            <div className="flex-1 p-6 overflow-y-auto">
              <Outlet />
            </div>

            {/* Right Alerts & Actions Bar */}
            <aside className="w-full xl:w-80 bg-white border-t xl:border-t-0 xl:border-l border-slate-200 p-6 flex flex-col space-y-6">
              {/* Alerts Watches Panel */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Alerts Panel</h3>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">{persona === 'CEO' ? 'CEO priority watchlist' : persona === 'CMO' ? 'CMO safety watchlist' : 'Operations watchlist'}</span>
                  </div>
                  <div className="relative">
                    <Bell className="h-5 w-5 text-slate-400" />
                    {alerts.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
                        {alerts.length}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {alerts.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400">
                      No active alerts on watchlist.
                    </div>
                  ) : (
                    alerts.map((alt) => (
                      <div key={alt.id} className="border border-slate-200 hover:border-slate-300 rounded-2xl p-4 bg-slate-50 transition-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase
                            ${alt.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                              alt.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                              alt.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}
                          `}>
                            {alt.priority}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{alt.status}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 mb-1">{alt.title}</h4>
                        <div className="text-[10px] text-slate-400 font-medium mb-2">{alt.department} | created {new Date(alt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <p className="text-xs text-slate-600 mb-3 leading-normal">{alt.description}</p>
                        
                        {alt.recommendedAction && (
                          <div className="bg-white border border-slate-200 rounded-xl p-2.5 mb-3 text-[11px] text-slate-500 italic">
                            <span className="font-bold text-slate-700 block not-italic">Recommendation:</span>
                            {alt.recommendedAction}
                          </div>
                        )}

                        <div className="flex space-x-2">
                          {alt.status === 'OPEN' && (
                            <div className="relative flex-1">
                              <button 
                                onClick={() => setAssigningAlertId(assigningAlertId === alt.id ? null : alt.id)}
                                className="w-full px-3 py-1.5 text-center text-[10px] font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                              >
                                Assign
                              </button>
                              
                              {assigningAlertId === alt.id && (
                                <div className="absolute left-0 bottom-8 z-50 w-48 bg-white border border-slate-200 rounded-xl shadow-lg max-h-36 overflow-y-auto p-1">
                                  {staffUsers.map((s) => (
                                    <button
                                      key={s.id}
                                      onClick={() => handleAssignAlert(alt.id, s.id)}
                                      className="w-full text-left px-2 py-1.5 text-[10px] hover:bg-slate-50 text-slate-700 font-semibold rounded-md"
                                    >
                                      {s.fullName}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          <button 
                            onClick={() => handleResolveAlert(alt.id)}
                            className="flex-1 px-3 py-1.5 text-center text-[10px] font-bold text-white bg-hospital-500 hover:bg-hospital-600 rounded-lg transition-colors"
                          >
                            Resolve
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* AI Actions panel */}
              <div className="border-t border-slate-200 pt-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Cpu className="h-5 w-5 text-hospital-500" />
                  <h3 className="text-sm font-bold text-slate-900">AI Actions</h3>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-3">Recommended next steps</span>
                
                <div className="space-y-3">
                  {aiInsights.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400">
                      Syncing operational guidelines...
                    </div>
                  ) : (
                    aiInsights.map((ins, index) => (
                      <div key={index} className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] font-bold text-hospital-600 uppercase">{ins.category || 'Clinical'}</span>
                          <span className={`h-1.5 w-1.5 rounded-full ${ins.priority === 'CRITICAL' ? 'bg-red-500' : ins.priority === 'HIGH' ? 'bg-orange-500' : 'bg-amber-500'}`}></span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 mb-1">{ins.title}</h4>
                        <p className="text-[11px] text-slate-500 leading-normal mb-3">{ins.recommendation}</p>
                        
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => navigate('/alerts')}
                            className="flex-1 px-3 py-1.5 text-center text-[10px] font-bold text-hospital-500 bg-white border border-hospital-200 hover:bg-hospital-50 rounded-lg transition-colors"
                          >
                            Review Recommendation
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
