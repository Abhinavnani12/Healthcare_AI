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
  Heart, 
  Wind, 
  UserCheck, 
  AlertCircle, 
  TrendingUp,
  Building,
  UserPlus
} from 'lucide-react';

const IcuOperations = () => {
  const { refreshInterval } = useAuth();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchIcuData = async () => {
    try {
      const res = await axios.get('/api/dashboard/icu');
      if (res.data.success) {
        setData(res.data.data);
        setError('');
      } else {
        setError('Failed to fetch ICU metrics.');
      }
    } catch (err) {
      console.error('Error fetching ICU dashboard:', err);
      setError('Connection to server failed. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIcuData();
    const interval = setInterval(fetchIcuData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (loading) {
    return (
      <div className="flex-grow flex flex-col justify-center items-center h-64 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-hospital-500"></div>
        <span className="text-sm font-semibold text-slate-500">Retrieving ventilator logs and telemetry...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex flex-col items-center justify-center">
        <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
        <span className="font-bold text-lg mb-1">ICU Telemetry Failure</span>
        <p className="text-sm text-center max-w-md">{error}</p>
        <button 
          onClick={() => { setLoading(true); fetchIcuData(); }}
          className="mt-4 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { kpis, charts, icuPatientWatchlist, transferReadyPatients } = data;

  const kpiCards = [
    { label: 'ICU Total Beds', value: kpis.icuTotalBeds, status: 'normal', icon: Building, color: 'text-hospital-500 bg-blue-50' },
    { label: 'ICU Occupied Beds', value: kpis.icuOccupiedBeds, status: kpis.icuOccupancy > 90 ? 'critical' : kpis.icuOccupancy > 80 ? 'high' : 'normal', icon: Activity, color: 'text-orange-500 bg-orange-50' },
    { label: 'ICU Available Beds', value: kpis.icuAvailableBeds, status: kpis.icuAvailableBeds < 10 ? 'critical' : 'normal', icon: Activity, color: 'text-teal-500 bg-teal-50' },
    { label: 'ICU Occupancy %', value: `${kpis.icuOccupancy}%`, status: kpis.icuOccupancy > 90 ? 'critical' : 'normal', icon: TrendingUp, color: 'text-hospital-500 bg-blue-50' },
    { label: 'Critical Patients', value: kpis.criticalPatients, status: 'high', icon: Heart, color: 'text-red-500 bg-red-50' },
    { label: 'High-Risk Patients', value: kpis.highRiskPatients, status: 'attention', icon: Heart, color: 'text-orange-500 bg-orange-50' },
    { label: 'Ventilators in Use', value: kpis.ventilatorsInUse, status: 'high', icon: Wind, color: 'text-hospital-500 bg-blue-50' },
    { label: 'Available Ventilators', value: kpis.availableVentilators, status: 'normal', icon: Wind, color: 'text-emerald-500 bg-emerald-50' },
    { label: 'Nurse-to-Patient Ratio', value: kpis.nurseToPatientRatio, status: 'normal', icon: UserCheck, color: 'text-emerald-500 bg-emerald-50' },
    { label: 'Expected Discharges', value: transferReadyPatients.length, status: 'normal', icon: UserPlus, color: 'text-teal-500 bg-teal-50' },
  ];

  const RISK_COLORS = ['#ef4444', '#f97316', '#10b981'];
  const riskDistribution = [
    { name: 'Critical', value: kpis.criticalPatients },
    { name: 'High-Risk', value: kpis.highRiskPatients },
    { name: 'Stable ICU', value: Math.max(0, kpis.icuOccupiedBeds - kpis.criticalPatients - kpis.highRiskPatients) },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 text-[10px] font-bold text-hospital-500 bg-blue-50 border border-blue-100 rounded-full uppercase">
            Clinical operations view
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">ICU Operations Dashboard</h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          Real-time tracking of critical care capacity, physiological monitoring load, and ventilator availability.
        </p>
      </div>

      {/* KPI Cards Grid */}
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ICU Occupancy Trend */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 h-[340px] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">ICU Bed Occupancy Trend</h3>
            <p className="text-xs text-slate-400 mb-4 font-semibold">24-hour bed pressure indicators</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.icuOccupancyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorIcuBeds" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Area type="monotone" name="Occupancy %" dataKey="occupancy" stroke="#ef4444" fillOpacity={1} fill="url(#colorIcuBeds)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ventilator Utilization Trend */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 h-[340px] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Ventilator Allocation</h3>
            <p className="text-xs text-slate-400 mb-4 font-semibold">In-use vs available ventilator count</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.ventilatorUtilizationTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar name="In Use" dataKey="inUse" fill="#1a56db" stackId="a" radius={[0, 0, 0, 0]} barSize={12} />
                <Bar name="Available" dataKey="available" fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 h-[340px] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Inpatient Risk Levels</h3>
            <p className="text-xs text-slate-400 mb-4 font-semibold">Categorized ICU patient acuity</p>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RISK_COLORS[index % RISK_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ICU watchlist */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">ICU Patient Watchlist</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Patient ID</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Assigned Physician</th>
                  <th className="pb-3">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {icuPatientWatchlist.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">No ICU patients on watch.</td>
                  </tr>
                ) : (
                  icuPatientWatchlist.map((pat) => (
                    <tr key={pat.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-semibold text-hospital-500">{pat.maskedPatientId}</td>
                      <td className="py-3 font-bold text-slate-900">{pat.patientName}</td>
                      <td className="py-3 text-slate-500">{pat.assignedDoctor}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-red-50 text-red-600 rounded-full">{pat.currentStage}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transfer ready patients */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Transfer-Ready Inpatients</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Patient ID</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Assigned Physician</th>
                  <th className="pb-3">Billing Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {transferReadyPatients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">No transfer-ready patients found.</td>
                  </tr>
                ) : (
                  transferReadyPatients.map((pat) => (
                    <tr key={pat.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-semibold text-hospital-500">{pat.maskedPatientId}</td>
                      <td className="py-3 font-bold text-slate-900">{pat.patientName}</td>
                      <td className="py-3 text-slate-500">{pat.assignedDoctor}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full
                          ${pat.billingStatus === 'CLEARED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}
                        `}>
                          {pat.billingStatus}
                        </span>
                      </td>
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

export default IcuOperations;
