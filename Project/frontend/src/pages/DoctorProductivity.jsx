import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  Users, 
  Activity, 
  Calendar, 
  CheckSquare, 
  Star, 
  AlertCircle,
  Stethoscope
} from 'lucide-react';

const DoctorProductivity = () => {
  const { refreshInterval } = useAuth();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDoctorData = async () => {
    try {
      const res = await axios.get('/api/dashboard/doctor-productivity');
      if (res.data.success) {
        setData(res.data.data);
        setError('');
      } else {
        setError('Failed to fetch doctor productivity metrics.');
      }
    } catch (err) {
      console.error('Error fetching doctor dashboard:', err);
      setError('Connection to server failed. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
    const interval = setInterval(fetchDoctorData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (loading) {
    return (
      <div className="flex-grow flex flex-col justify-center items-center h-64 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-hospital-500"></div>
        <span className="text-sm font-semibold text-slate-500">Compiling physician case summaries...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex flex-col items-center justify-center">
        <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
        <span className="font-bold text-lg mb-1">Metrics Retrieval Failure</span>
        <p className="text-sm text-center max-w-md">{error}</p>
        <button 
          onClick={() => { setLoading(true); fetchDoctorData(); }}
          className="mt-4 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { kpis, doctorPerformanceList, charts } = data;

  const kpiCards = [
    { label: 'Active Doctors', value: kpis.activeDoctors, status: 'normal', icon: Users, color: 'text-hospital-500 bg-blue-50' },
    { label: 'Doctors on Duty', value: kpis.doctorsOnDuty, status: 'normal', icon: Stethoscope, color: 'text-emerald-500 bg-emerald-50' },
    { label: 'Consultations Completed', value: kpis.consultationsCompleted, status: 'normal', icon: Activity, color: 'text-hospital-500 bg-blue-50' },
    { label: 'Scheduled Surgeries', value: kpis.scheduledSurgeries, status: 'attention', icon: Calendar, color: 'text-amber-500 bg-amber-50' },
    { label: 'Pending Consultations', value: kpis.pendingConsultations, status: 'attention', icon: CheckSquare, color: 'text-amber-500 bg-amber-50' },
    { label: 'High-Workload Doctors', value: kpis.highWorkloadDoctors, status: kpis.highWorkloadDoctors > 0 ? 'high' : 'normal', icon: AlertCircle, color: 'text-orange-500 bg-orange-50' },
    { label: 'Average Patient Feedback', value: `${kpis.averagePatientFeedback}/5`, status: 'normal', icon: Star, color: 'text-emerald-500 bg-emerald-50' },
    { label: 'Unassigned Tasks', value: kpis.unassignedTasks, status: 'normal', icon: CheckSquare, color: 'text-hospital-500 bg-blue-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 text-[10px] font-bold text-hospital-500 bg-blue-50 border border-blue-100 rounded-full uppercase">
            Clinical Staffing View
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Doctor Productivity Dashboard</h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          Monitor clinical workloads, completed consults, surgicial backlogs, and patient ratings.
        </p>
      </div>

      {/* KPIs */}
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
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 h-[340px] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Consultations by Department</h3>
            <p className="text-xs text-slate-400 mb-4 font-semibold">Caseload resolution per department layer</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.consultationsByDept} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                <Bar name="Consultations" dataKey="value" fill="#1a56db" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Doctor List Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900">Physician Roster & Workloads</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                <th className="px-6 py-4">Doctor Name</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4 text-center">Patients Handled</th>
                <th className="px-6 py-4 text-center">Consultations</th>
                <th className="px-6 py-4 text-center">Surgeries</th>
                <th className="px-6 py-4 text-center">Pending Tasks</th>
                <th className="px-6 py-4 text-center">Rating</th>
                <th className="px-6 py-4 text-center">Workload</th>
                <th className="px-6 py-4 text-center">Roster Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {doctorPerformanceList.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-slate-900">{doc.name}</td>
                  <td className="px-6 py-4 font-semibold text-slate-500">{doc.department}</td>
                  <td className="px-6 py-4 text-center font-bold">{doc.patientsHandled}</td>
                  <td className="px-6 py-4 text-center">{doc.consultationsCompleted}</td>
                  <td className="px-6 py-4 text-center font-bold">{doc.surgerySchedule}</td>
                  <td className="px-6 py-4 text-center font-bold text-slate-800">{doc.pendingTasks}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="flex items-center justify-center text-amber-500 font-bold">
                      <Star className="h-3.5 w-3.5 fill-current mr-1" />
                      {doc.patientFeedback.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase
                      ${doc.workloadLevel === 'Critical' ? 'bg-red-50 text-red-600 border border-red-100' :
                        doc.workloadLevel === 'High' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                        doc.workloadLevel === 'Moderate' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-emerald-50 text-emerald-600 border border-emerald-100'}
                    `}>
                      {doc.workloadLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full
                      ${doc.availabilityStatus === 'On duty' || doc.availabilityStatus === 'On duty' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}
                    `}>
                      {doc.availabilityStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorProductivity;
