import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Calendar, 
  Filter, 
  Download, 
  Check, 
  AlertCircle,
  Clock,
  Play
} from 'lucide-react';

const Reports = () => {
  const { refreshInterval } = useAuth();
  
  const [reportsHistory, setReportsHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Report config
  const [reportType, setReportType] = useState('executive');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('');
  
  const [generatedReportResult, setGeneratedReportResult] = useState(null);

  const fetchReportsHistory = async () => {
    try {
      const res = await axios.get('/api/reports');
      if (res.data.success) {
        setReportsHistory(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch reports log:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchReportsHistory();
  }, []);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setLoadingGenerate(true);
    setError('');
    setSuccess('');
    setGeneratedReportResult(null);

    try {
      const res = await axios.post('/api/reports/generate', {
        type: reportType,
        startDate,
        endDate,
        department
      });

      if (res.data.success) {
        setGeneratedReportResult(res.data.data);
        setSuccess('Report generated successfully!');
        fetchReportsHistory();
      }
    } catch (err) {
      console.error('Report generation error:', err);
      setError(err.response?.data?.message || 'Report generation failed.');
    } finally {
      setLoadingGenerate(false);
    }
  };

  const triggerCSVDownload = () => {
    if (!generatedReportResult) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    const title = `Report: ${generatedReportResult.name}\nGenerated: ${new Date(generatedReportResult.createdAt).toLocaleString()}\n\n`;
    csvContent += title;

    const summary = generatedReportResult.data;
    if (reportType === 'executive') {
      csvContent += `Metric,Value\n`;
      csvContent += `Total Days Logged,${summary.totalDaysLogged}\n`;
      csvContent += `Avg Beds Occupied,${summary.avgBedsOccupied.toFixed(1)}\n`;
      csvContent += `Avg Patient Satisfaction,${summary.avgPatientSatisfaction.toFixed(1)}\n`;
      csvContent += `Total Collected Revenue,$${summary.totalRevenue.toLocaleString()}\n`;
      csvContent += `Total Operating Costs,$${summary.totalOperatingCosts.toLocaleString()}\n`;
    } else if (reportType === 'emergency') {
      csvContent += `Metric,Value\n`;
      csvContent += `Total Patients Received,${summary.totalPatientsReceived}\n`;
      csvContent += `Avg Wait Time (min),${summary.avgWaitMinutes.toFixed(1)}\n`;
      csvContent += `Wait Times Above SLA,${summary.waitTimeAboveSLA}\n`;
      csvContent += `Critical Triage,${summary.casesByTriage.Critical}\n`;
      csvContent += `High Triage,${summary.casesByTriage.High}\n`;
    } else {
      csvContent += JSON.stringify(summary, null, 2);
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportType}_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reportTypes = [
    { key: 'executive', name: 'Executive Hospital Summary', desc: 'Overall bed occupancies, operations satisfaction, revenues.' },
    { key: 'icu', name: 'ICU Operational Report', desc: 'Critical patient acuity trends and ventilator usage logs.' },
    { key: 'emergency', name: 'Emergency Room Report', desc: 'Triage categories, arrivals density, and waiting time SLA.' },
    { key: 'patient-journey', name: 'Patient Journey Report', desc: 'Treatment stages aggregates and discharge delay logs.' },
    { key: 'doctor-productivity', name: 'Doctor Productivity Report', desc: 'Consultations completed, surgeon counts, workload metrics.' },
    { key: 'financial', name: 'Financial Summary', desc: 'Collected bills, outstanding payments, claim rejection analysis.' },
    { key: 'alerts', name: 'Alerts Frequency Summary', desc: 'Audit metrics on alerts generated, assigned, and resolved.' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reports & Clinical Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5 font-medium">Generate audited datasets, executive summaries, and operations CSVs.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Generator Controls */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-hospital-500" />
              Configure Report parameters
            </h3>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-start space-x-2 text-sm mb-4">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center space-x-2 text-sm mb-4">
                <Check className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold">{success}</span>
              </div>
            )}

            <form onSubmit={handleGenerateReport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Report Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {reportTypes.map((type) => (
                    <button
                      key={type.key}
                      type="button"
                      onClick={() => setReportType(type.key)}
                      className={`
                        p-3.5 border rounded-2xl text-left transition-all duration-150
                        ${reportType === type.key 
                          ? 'bg-blue-50 border-hospital-200 text-hospital-500 shadow-sm' 
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}
                      `}
                    >
                      <span className="text-xs font-bold block">{type.name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold leading-tight block mt-0.5">{type.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-slate-400" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-slate-400" />
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center">
                  <Filter className="h-4 w-4 mr-1 text-slate-400" />
                  Department Filter (Optional)
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="">All Departments</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Emergency">Emergency</option>
                  <option value="ICU">ICU</option>
                  <option value="Cardiology">Cardiology</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loadingGenerate}
                className="w-full py-3 bg-hospital-500 hover:bg-hospital-600 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Play className="h-4 w-4" />
                <span>{loadingGenerate ? 'Analyzing database records...' : 'Compile Report'}</span>
              </button>
            </form>
          </div>

          {/* Generated Result Preview */}
          {generatedReportResult && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{generatedReportResult.name}</h3>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Generated by {generatedReportResult.generatedBy}</span>
                </div>
                <button
                  onClick={triggerCSVDownload}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download CSV</span>
                </button>
              </div>

              {/* Data Summary View */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-slate-700">
                <span className="font-bold text-slate-900 block mb-3 uppercase tracking-wider text-[10px]">Report Data Summary</span>
                <pre className="text-slate-600 leading-relaxed font-mono whitespace-pre-wrap">
                  {JSON.stringify(generatedReportResult.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Generated logs history */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-slate-400" />
            Audit Logs History
          </h3>

          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {loadingHistory ? (
              <div className="text-center py-6 text-xs text-slate-400">Loading audit history...</div>
            ) : reportsHistory.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                No past reports generated.
              </div>
            ) : (
              reportsHistory.map((rep) => (
                <div key={rep.id} className="border border-slate-200 p-3 bg-slate-50/50 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-800 mb-0.5">{rep.name}</h4>
                  <div className="text-[10px] text-slate-400 font-semibold mb-1">Type: {rep.type}</div>
                  <div className="text-[9px] text-slate-400">
                    Compiled by <span className="font-bold text-slate-500">{rep.generatedBy}</span> on {new Date(rep.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
