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
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from 'recharts';
import { 
  Users, 
  Bed, 
  Clock, 
  AlertOctagon, 
  TrendingUp, 
  TrendingDown, 
  HeartHandshake, 
  DollarSign, 
  Activity, 
  Building,
  ChevronDown
} from 'lucide-react';

const HospitalExecutive = () => {
  const { persona, refreshInterval } = useAuth();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedChip, setSelectedChip] = useState('Overall hospital performance');

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get('/api/dashboard/executive');
      if (res.data.success) {
        setData(res.data.data);
        setError('');
      } else {
        setError('Failed to fetch operational summary.');
      }
    } catch (err) {
      console.error('Error fetching executive dashboard:', err);
      setError('Connection to server failed. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-64 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-hospital-500"></div>
        <span className="text-sm font-semibold text-slate-500">Synchronizing system logs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex flex-col items-center justify-center">
        <AlertOctagon className="h-10 w-10 text-red-500 mb-3" />
        <span className="font-bold text-lg mb-1">Operational Sync Failure</span>
        <p className="text-sm text-center max-w-md">{error}</p>
        <button 
          onClick={() => { setLoading(true); fetchDashboardData(); }}
          className="mt-4 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { kpis, charts, priorityDepartments, recentEscalations } = data;

  // Formatting helpers
  const formatMoney = (val) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };

  // KPI card specifications
  const kpiDefinitions = {
    totalBeds: { label: 'Total Beds', value: kpis.totalBeds.toLocaleString(), status: 'normal', icon: Building, color: 'text-hospital-500 bg-blue-50' },
    occupiedBeds: { label: 'Occupied Beds', value: kpis.occupiedBeds.toLocaleString(), status: 'high', icon: Bed, color: 'text-orange-500 bg-orange-50' },
    availableBeds: { label: 'Available Beds', value: kpis.availableBeds.toLocaleString(), status: 'attention', icon: Bed, color: 'text-teal-500 bg-teal-50' },
    bedOccupancy: { label: 'Bed Occupancy', value: `${kpis.bedOccupancy}%`, status: 'normal', icon: Activity, color: 'text-hospital-500 bg-blue-50' },
    patientSatisfaction: { label: 'Patient Satisfaction', value: kpis.patientSatisfaction.toString(), status: 'normal', icon: HeartHandshake, color: 'text-emerald-500 bg-emerald-50' },
    operatingCosts: { label: 'Operating Costs', value: formatMoney(kpis.operatingCosts), status: 'attention', icon: DollarSign, color: 'text-amber-500 bg-amber-50' },
    icuOccupancy: { label: 'ICU Occupancy', value: `${kpis.icuOccupancy}%`, status: 'high', icon: Building, color: 'text-orange-500 bg-orange-50' },
    erWaiting: { label: 'ER Waiting', value: kpis.erWaiting.toLocaleString(), status: 'critical', icon: Clock, color: 'text-red-500 bg-red-50' },
    majorRisks: { label: 'Major Risks', value: kpis.majorRisks.toString(), status: 'critical', icon: AlertOctagon, color: 'text-red-500 bg-red-50' },
    dailyRevenue: { label: 'Daily Revenue', value: formatMoney(kpis.dailyRevenue), status: 'normal', icon: DollarSign, color: 'text-emerald-500 bg-emerald-50' }
  };

  // Define KPI ordering based on Persona
  let orderedKpis = [];
  if (persona === 'CEO') {
    orderedKpis = [
      'totalBeds', 'occupiedBeds', 'availableBeds', 'bedOccupancy', 'patientSatisfaction',
      'operatingCosts', 'icuOccupancy', 'erWaiting', 'majorRisks', 'dailyRevenue'
    ];
  } else if (persona === 'CMO') {
    orderedKpis = [
      'icuOccupancy', 'erWaiting', 'majorRisks', 'patientSatisfaction', 'occupiedBeds',
      'totalBeds', 'availableBeds', 'bedOccupancy', 'operatingCosts', 'dailyRevenue'
    ];
  } else { // OPERATIONS_HEAD
    orderedKpis = [
      'availableBeds', 'erWaiting', 'occupiedBeds', 'bedOccupancy', 'icuOccupancy',
      'totalBeds', 'patientSatisfaction', 'operatingCosts', 'majorRisks', 'dailyRevenue'
    ];
  }

  // Chips categories based on persona
  const categoryChips = [
    'Overall hospital performance',
    'Bed occupancy',
    'Revenue',
    'Operating costs',
    'Patient satisfaction',
    'Major hospital-wide risks'
  ];

  // Colors for donut chart
  const PIE_COLORS = ['#1a56db', '#0d9488', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 text-[10px] font-bold text-hospital-500 bg-blue-50 border border-blue-100 rounded-full uppercase">
            {persona === 'CEO' ? 'CEO view' : persona === 'CMO' ? 'CMO view' : 'Operations Head view'} | secure prototype
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hospital Executive Dashboard</h1>
        <p className="text-sm text-slate-500 max-w-4xl leading-relaxed">
          Bed pressure is concentrated in emergency intake and general medicine. Revenue remains ahead of plan, but discharge delays and claim documentation gaps are creating avoidable operational drag.
        </p>
      </div>

      {/* Category Chips */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        {categoryChips.map((chip) => {
          const isActive = selectedChip === chip;
          return (
            <button
              key={chip}
              onClick={() => setSelectedChip(chip)}
              className={`
                px-4 py-2 text-xs font-semibold rounded-full border transition-all duration-150
                ${isActive 
                  ? 'bg-blue-50 border-hospital-200 text-hospital-500 shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
              `}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {/* Priority Departments Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center space-x-2.5 text-xs font-semibold">
        <span className="text-slate-400">Priority departments:</span>
        {priorityDepartments.map((dept, index) => (
          <React.Fragment key={dept.name}>
            <span className={`
              ${dept.load === 'Critical' ? 'text-red-600 font-bold' : dept.load === 'High' ? 'text-orange-600 font-bold' : 'text-slate-700 font-medium'}
            `}>
              {dept.name} ({dept.value})
            </span>
            {index < priorityDepartments.length - 1 && <span className="text-slate-300">|</span>}
          </React.Fragment>
        ))}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {orderedKpis.map((key) => {
          const card = kpiDefinitions[key];
          return (
            <div key={key} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between transition-card">
              <div className="flex items-start justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
                <div className={`p-2 rounded-xl ${card.color}`}>
                  <card.icon className="h-4 w-4" />
                </div>
              </div>
              
              <div className="flex items-end justify-between">
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
                <ChevronDown className="h-4 w-4 text-slate-300 hover:text-slate-600 cursor-pointer" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Bed Occupancy Trend */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between h-[360px]">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Bed Occupancy Trend</h3>
            <p className="text-xs text-slate-400 mb-4 font-semibold">Hospital, ICU, and emergency utilization through the day</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.bedOccupancyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorHospital" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a56db" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1a56db" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorIcu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Area type="monotone" name="Hospital Bed %" dataKey="hospitalOccupancy" stroke="#1a56db" fillOpacity={1} fill="url(#colorHospital)" strokeWidth={2} />
                <Area type="monotone" name="ICU Occupancy %" dataKey="icuOccupancy" stroke="#0d9488" fillOpacity={1} fill="url(#colorIcu)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Patient Distribution */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between h-[360px]">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Department Patient Distribution</h3>
            <p className="text-xs text-slate-400 mb-4 font-semibold">Current inpatient and emergency load</p>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.departmentPatientDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {charts.departmentPatientDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Admissions Versus Discharges */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between h-[360px]">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Admissions Versus Discharges</h3>
            <p className="text-xs text-slate-400 mb-4 font-semibold">Five-day operational flow</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.admissionsVsDischarges} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar name="Admissions" dataKey="admissions" fill="#1a56db" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar name="Discharges" dataKey="discharges" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Data Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent critical escalations */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Priority Escalations Watch</h3>
          <div className="space-y-3">
            {recentEscalations.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                No active critical escalations.
              </div>
            ) : (
              recentEscalations.map((esc) => (
                <div key={esc.id} className="flex items-start justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 mb-1">{esc.title}</h4>
                    <p className="text-[11px] text-slate-500 mb-1">{esc.description}</p>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{esc.department} | {new Date(esc.createdAt).toLocaleString()}</span>
                  </div>
                  <span className="px-2 py-0.5 text-[9px] font-bold text-red-700 bg-red-100 rounded-full">
                    CRITICAL
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Department performance table */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Department Operational Focus</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Department</th>
                  <th className="pb-3 text-center">Inpatient Count</th>
                  <th className="pb-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                <tr>
                  <td className="py-3 font-semibold text-slate-800">Cardiology</td>
                  <td className="py-3 text-center font-bold">120</td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-50 text-emerald-600 rounded-full">NORMAL</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-slate-800">Emergency Room</td>
                  <td className="py-3 text-center font-bold">{kpis.erWaiting}</td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-red-50 text-red-600 rounded-full">CRITICAL</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-slate-800">ICU Operations</td>
                  <td className="py-3 text-center font-bold">102</td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-orange-50 text-orange-600 rounded-full">HIGH</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-slate-800">General Medicine</td>
                  <td className="py-3 text-center font-bold">320</td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-50 text-emerald-600 rounded-full">NORMAL</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalExecutive;
