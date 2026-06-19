import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Clock, 
  Database, 
  ShieldCheck, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';

const Settings = () => {
  const { user, refreshInterval, setRefreshInterval, persona, setPersona, getAllowedPersonas } = useAuth();
  
  const [successMsg, setSuccessMsg] = useState('');
  
  // Settings variables
  const [profileName, setProfileName] = useState(user?.fullName || '');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [defaultPersona, setDefaultPersona] = useState(user?.role || 'OPERATIONS_HEAD');

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSuccessMsg('Preferences updated successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Settings & Preferences</h1>
        <p className="text-sm text-slate-500 mt-0.5 font-medium">Manage user profile variables, notification triggers, and telemetry connection states.</p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center space-x-2.5 text-sm">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settings categories */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-hospital-500" />
              User Profile
            </h3>
            
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-3.5 py-2 text-sm bg-slate-100 border border-slate-200 text-slate-400 rounded-xl focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Assigned Facility Role</label>
                <div className="px-3.5 py-2 text-sm bg-slate-100 border border-slate-200 text-slate-500 rounded-xl font-bold uppercase inline-block">
                  {user?.role}
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-hospital-500 hover:bg-hospital-600 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Save Profile Variables
              </button>
            </form>
          </div>

          {/* Telemetry settings */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-hospital-500" />
              Telemetry Polling
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Data Sync Interval</label>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 focus:outline-none w-48"
                >
                  <option value={15}>15 Seconds (Rapid)</option>
                  <option value={30}>30 Seconds (Default)</option>
                  <option value={60}>60 Seconds (Standard)</option>
                  <option value={120}>120 Seconds (Conserved)</option>
                </select>
                <span className="block text-[10px] text-slate-400 font-semibold mt-1.5">Controls dashboard fetch rate. Higher values conserve server resources.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Default Login Persona</label>
                <select
                  value={defaultPersona}
                  onChange={(e) => { setDefaultPersona(e.target.value); setPersona(e.target.value); }}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 focus:outline-none w-48"
                >
                  {getAllowedPersonas.map(p => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-hospital-500" />
              System Notifications
            </h3>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3 text-xs font-semibold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemAlerts}
                  onChange={(e) => setSystemAlerts(e.target.checked)}
                  className="h-4.5 w-4.5 border-slate-200 rounded text-hospital-500 focus:ring-hospital-500"
                />
                <span>Enable audio chime on CRITICAL alert incidents</span>
              </label>

              <label className="flex items-center space-x-3 text-xs font-semibold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="h-4.5 w-4.5 border-slate-200 rounded text-hospital-500 focus:ring-hospital-500"
                />
                <span>Digest emails for resolved operations tickets</span>
              </label>
            </div>
          </div>
        </div>

        {/* Security / Feeds side info card */}
        <div className="space-y-6">
          {/* Connection status */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
              <Database className="h-5 w-5 mr-2 text-slate-400" />
              Data Feeds Status
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">MySQL Server Integration</span>
                <span className="px-2 py-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100 rounded-full">CONNECTED</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Ventilator Telemetry Feed</span>
                <span className="px-2 py-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100 rounded-full">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">ER Intake Ambulances</span>
                <span className="px-2 py-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100 rounded-full">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Pharmacy Stock Feeds</span>
                <span className="px-2 py-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100 rounded-full">CONNECTED</span>
              </div>
            </div>
          </div>

          {/* Safety Summary info card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-hospital-500">
              <ShieldCheck className="h-5 w-5" />
              <h4 className="text-sm font-bold text-slate-900">Security Summary</h4>
            </div>
            <p className="text-xs text-slate-500 leading-normal">
              EHR credentials and patient telemetry lines are protected in transit. Patient details shown in general lists utilize masked indices.
            </p>
            <div className="text-[10px] text-slate-400 font-semibold">
              Prototype session active under sandbox credentials.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
