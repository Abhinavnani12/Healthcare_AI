import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Truck, 
  Users, 
  Heart,
  UserCheck,
  TrendingUp
} from 'lucide-react';

const EmergencyRoom = () => {
  const { refreshInterval } = useAuth();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchErData = async () => {
    try {
      const res = await axios.get('/api/dashboard/emergency');
      if (res.data.success) {
        setData(res.data.data);
        setError('');
      } else {
        setError('Failed to fetch Emergency Room metrics.');
      }
    } catch (err) {
      console.error('Error fetching ER dashboard:', err);
      setError('Connection to server failed. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErData();
    const interval = setInterval(fetchErData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (loading) {
    return (
      <div className="flex-grow flex flex-col justify-center items-center h-64 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-hospital-500"></div>
        <span className="text-sm font-semibold text-slate-500">Synchronizing ER arrivals and triage boards...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex flex-col items-center justify-center">
        <AlertTriangle className="h-10 w-10 text-red-500 mb-3" />
        <span className="font-bold text-lg mb-1">ER Metrics Sync Failure</span>
        <p className="text-sm text-center max-w-md">{error}</p>
        <button 
          onClick={() => { setLoading(true); fetchErData(); }}
          className="mt-4 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { kpis, emergencyQueue, incomingAmbulanceList, triageCategoryDistribution } = data;

  const kpiCards = [
    { label: 'Patients Waiting', value: kpis.patientsWaiting, status: kpis.patientsWaiting > 40 ? 'critical' : 'normal', icon: Users, color: 'text-red-500 bg-red-50' },
    { label: 'Critical Cases', value: kpis.criticalCases, status: 'high', icon: Heart, color: 'text-orange-500 bg-orange-50' },
    { label: 'Average Waiting Time', value: `${kpis.averageWaitingTime}m`, status: kpis.averageWaitingTime > 40 ? 'critical' : 'normal', icon: Clock, color: 'text-red-500 bg-red-50' },
    { label: 'Waiting Time Above SLA', value: kpis.waitingTimeAboveSLA, status: kpis.waitingTimeAboveSLA > 5 ? 'critical' : 'normal', icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
    { label: 'Incoming Ambulances', value: kpis.incomingAmbulancesCount, status: 'normal', icon: Truck, color: 'text-hospital-500 bg-blue-50' },
    { label: 'Available ER Doctors', value: kpis.availableDoctors, status: 'normal', icon: UserCheck, color: 'text-emerald-500 bg-emerald-50' },
    { label: 'Available ER Beds', value: kpis.availableBeds, status: kpis.availableBeds < 15 ? 'critical' : 'normal', icon: Activity, color: 'text-teal-500 bg-teal-50' },
    { label: 'ER Occupancy', value: `${kpis.erOccupancy}%`, status: kpis.erOccupancy > 80 ? 'high' : 'normal', icon: TrendingUp, color: 'text-hospital-500 bg-blue-50' },
    { label: 'Triage Pending', value: kpis.triagePending, status: 'attention', icon: ShieldAlert, color: 'text-amber-500 bg-amber-50' },
    { label: 'Overcrowding Risk', value: kpis.patientsWaiting > 40 ? 'HIGH' : 'LOW', status: kpis.patientsWaiting > 40 ? 'critical' : 'normal', icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
  ];

  const TRIAGE_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981'];

  // Simulated Hourly arrivals (Vibrant chart representation)
  const arrivalsByHour = [
    { hour: '08:00', arrivals: 12 },
    { hour: '10:00', arrivals: 18 },
    { hour: '12:00', arrivals: 25 },
    { hour: '14:00', arrivals: 32 },
    { hour: '16:00', arrivals: 28 },
    { hour: '18:00', arrivals: 19 },
    { hour: '20:00', arrivals: 14 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 text-[10px] font-bold text-hospital-500 bg-blue-50 border border-blue-100 rounded-full uppercase">
            Emergency Triage Center
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Emergency Room (ER) Dashboard</h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          Triage metrics, waiting room queues, emergency bed allocation, and ambulance dispatch status tracker.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpiCards.map((card, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between transition-card">
            <div className="flex items-start justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
              <div className={`p-2 rounded-xl ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            
            <div>
              <span className="text-2xl font-extrabold text-slate-900 leading-none">{card.value}</span>
              <div className="mt-2">
                <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full uppercase
                  ${card.status === 'normal' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    card.status === 'attention' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                    card.status === 'high' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                    'bg-red-50 text-red-600 border border-red-100'}
                `}>
                  {card.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Hourly arrivals */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 h-[340px] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Patient Arrivals by Hour</h3>
            <p className="text-xs text-slate-400 mb-4 font-semibold">Hourly emergency intake distribution</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={arrivalsByHour} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Bar name="Arrivals" dataKey="arrivals" fill="#1a56db" radius={[4, 4, 0, 0]} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Triage category distribution */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 h-[340px] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Triage Category Distribution</h3>
            <p className="text-xs text-slate-400 mb-4 font-semibold">Patient classification acuity levels</p>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={triageCategoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {triageCategoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={TRIAGE_COLORS[index % TRIAGE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ER Waiting Time Trend */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 h-[340px] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Average Wait Time Trend</h3>
            <p className="text-xs text-slate-400 mb-4 font-semibold">Emergency wait room resolution time SLA</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={arrivalsByHour} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorWaitTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Area type="monotone" name="Wait Minutes" dataKey="arrivals" stroke="#ef4444" fillOpacity={1} fill="url(#colorWaitTrend)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Emergency Queue */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Emergency Intake Queue</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Case ID</th>
                  <th className="pb-3">Triage</th>
                  <th className="pb-3 text-center">Wait Time</th>
                  <th className="pb-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {emergencyQueue.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">No active emergency cases in queue.</td>
                  </tr>
                ) : (
                  emergencyQueue.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-semibold text-hospital-500">{c.caseNumber}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase
                          ${c.triageCategory === 'Critical' ? 'bg-red-100 text-red-700' :
                            c.triageCategory === 'High' ? 'bg-orange-100 text-orange-700' :
                            c.triageCategory === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}
                        `}>
                          {c.triageCategory}
                        </span>
                      </td>
                      <td className="py-3 text-center font-bold text-slate-800">{c.waitMinutes}m</td>
                      <td className="py-3 text-center">
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-600 rounded-full">{c.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Incoming Ambulances */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Incoming Ambulance Fleet</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Vehicle</th>
                  <th className="pb-3">ETA</th>
                  <th className="pb-3">Triage Category</th>
                  <th className="pb-3 text-center">Inpatient Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {incomingAmbulanceList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">No incoming ambulances currently reporting.</td>
                  </tr>
                ) : (
                  incomingAmbulanceList.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-semibold text-slate-800 flex items-center">
                        <Truck className="h-4 w-4 mr-2 text-slate-400" />
                        {a.vehicleCode}
                      </td>
                      <td className="py-3 font-bold text-hospital-500">
                        {new Date(a.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase
                          ${a.triageCategory === 'Critical' ? 'bg-red-100 text-red-700' :
                            a.triageCategory === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}
                        `}>
                          {a.triageCategory}
                        </span>
                      </td>
                      <td className="py-3 text-center font-bold text-slate-800">{a.patientCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyRoom;
