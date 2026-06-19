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
  Cell
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  Briefcase, 
  CreditCard, 
  FileCheck, 
  AlertCircle,
  TrendingDown
} from 'lucide-react';

const FinancialDashboard = () => {
  const { refreshInterval } = useAuth();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFinancialData = async () => {
    try {
      const res = await axios.get('/api/dashboard/financial');
      if (res.data.success) {
        setData(res.data.data);
        setError('');
      } else {
        setError('Failed to fetch financial metrics.');
      }
    } catch (err) {
      console.error('Error fetching financial dashboard:', err);
      setError('Connection to server failed. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
    const interval = setInterval(fetchFinancialData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (loading) {
    return (
      <div className="flex-grow flex flex-col justify-center items-center h-64 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-hospital-500"></div>
        <span className="text-sm font-semibold text-slate-500">Syncing ledger balances and billing logs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex flex-col items-center justify-center">
        <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
        <span className="font-bold text-lg mb-1">Financial Data Failure</span>
        <p className="text-sm text-center max-w-md">{error}</p>
        <button 
          onClick={() => { setLoading(true); fetchFinancialData(); }}
          className="mt-4 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { kpis, charts, outstandingInvoices, insuranceClaims } = data;

  const formatMoney = (val) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };

  const kpiCards = [
    { label: 'Daily Revenue', value: formatMoney(kpis.dailyRevenue), status: 'normal', icon: DollarSign, color: 'text-hospital-500 bg-blue-50' },
    { label: 'Collected Revenue', value: formatMoney(kpis.collectedRevenue), status: 'normal', icon: CreditCard, color: 'text-emerald-500 bg-emerald-50' },
    { label: 'Outstanding Payments', value: formatMoney(kpis.outstandingPayments), status: 'attention', icon: AlertCircle, color: 'text-amber-500 bg-amber-50' },
    { label: 'Insurance Claims', value: kpis.insuranceClaimsCount, status: 'normal', icon: Briefcase, color: 'text-hospital-500 bg-blue-50' },
    { label: 'Rejected Claims', value: `${kpis.rejectedClaimsCount} (${formatMoney(kpis.rejectedClaimsAmount)})`, status: kpis.rejectedClaimsCount > 0 ? 'high' : 'normal', icon: AlertCircle, color: 'text-red-500 bg-red-50' },
    { label: 'Operating Costs', value: formatMoney(kpis.operatingCosts), status: 'attention', icon: TrendingDown, color: 'text-amber-500 bg-amber-50' },
    { label: 'Net Profit/Loss', value: formatMoney(kpis.netProfit), status: kpis.netProfit > 0 ? 'normal' : 'critical', icon: TrendingUp, color: 'text-emerald-500 bg-emerald-50' },
    { label: 'Revenue Growth', value: `+${kpis.revenueGrowthPercentage}%`, status: 'normal', icon: FileCheck, color: 'text-emerald-500 bg-emerald-50' },
  ];

  const DEPT_COLORS = ['#1a56db', '#0d9488', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 text-[10px] font-bold text-hospital-500 bg-blue-50 border border-blue-100 rounded-full uppercase">
            Finance & Ledger View
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hospital Financial Dashboard</h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          Operational expenses audit, billing transaction pipelines, collected payments, and insurance claim tracking.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        {/* Revenue vs Expenses */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 h-[340px] flex flex-col justify-between xl:col-span-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Revenue vs Expenses Trend</h3>
            <p className="text-xs text-slate-400 mb-4 font-semibold">Comparison of collections vs operational outlays</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.revenueVsExpensesTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" name="Collections ($)" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                <Area type="monotone" name="Operating Costs ($)" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Revenue Donut */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 h-[340px] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Department Revenue Distribution</h3>
            <p className="text-xs text-slate-400 mb-4 font-semibold">Total collections share per department</p>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.departmentRevenue}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {charts.departmentRevenue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Outstanding invoices */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Pending Invoice Pipeline</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Invoice No.</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3 text-center">Amount</th>
                  <th className="pb-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {outstandingInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-semibold text-slate-800">{inv.invoiceNumber}</td>
                    <td className="py-3 text-slate-500 font-semibold">{inv.department}</td>
                    <td className="py-3 text-center font-bold text-slate-900">${parseFloat(inv.amount).toLocaleString()}</td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 text-[9px] font-bold bg-red-100 text-red-700 rounded-full">{inv.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insurance claims status */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Insurance Claims Board</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Claim No.</th>
                  <th className="pb-3 text-center">Amount</th>
                  <th className="pb-3 text-center">Submitted At</th>
                  <th className="pb-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {insuranceClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-semibold text-slate-800">{claim.claimNumber}</td>
                    <td className="py-3 text-center font-bold text-slate-900">${parseFloat(claim.amount).toLocaleString()}</td>
                    <td className="py-3 text-center text-slate-400">
                      {new Date(claim.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase
                        ${claim.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}
                      `}>
                        {claim.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
