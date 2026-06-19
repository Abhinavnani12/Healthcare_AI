import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Eye, 
  X, 
  Check, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Download
} from 'lucide-react';

const PatientJourney = () => {
  const { refreshInterval } = useAuth();
  
  // State
  const [journeys, setJourneys] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter & Search State
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [billingFilter, setBillingFilter] = useState('');
  const [sortBy, setSortBy] = useState('admissionDate');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Selected Record State
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [formData, setFormData] = useState({
    patientName: '',
    department: 'General Medicine',
    assignedDoctor: '',
    admissionDate: new Date().toISOString().split('T')[0],
    currentStage: 'REGISTRATION',
    pendingTests: '',
    expectedDischargeDate: '',
    delayReason: '',
    billingStatus: 'PENDING',
    notes: '',
  });

  const stages = [
    'REGISTRATION', 'CONSULTATION', 'TESTS', 'DIAGNOSIS', 
    'ADMISSION', 'TREATMENT', 'DISCHARGE', 'FOLLOW_UP'
  ];
  
  const billingStatuses = ['PENDING', 'CLEARED', 'INSURANCE_REVIEW'];

  const fetchJourneys = async () => {
    try {
      const res = await axios.get('/api/patient-journeys', {
        params: {
          search,
          department: deptFilter,
          stage: stageFilter,
          billingStatus: billingFilter,
          sortBy,
          sortOrder,
          page,
          limit,
        }
      });

      if (res.data.success) {
        setJourneys(res.data.data.list);
        setTotal(res.data.data.pagination.total);
        setTotalPages(res.data.data.pagination.totalPages);
        setError('');
      }
    } catch (err) {
      console.error('Fetch journeys error:', err);
      setError('Failed to retrieve patient journeys.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourneys();
  }, [search, deptFilter, stageFilter, billingFilter, sortBy, sortOrder, page]);

  const handleOpenAddModal = () => {
    setFormData({
      patientName: '',
      department: 'General Medicine',
      assignedDoctor: '',
      admissionDate: new Date().toISOString().split('T')[0],
      currentStage: 'REGISTRATION',
      pendingTests: '',
      expectedDischargeDate: '',
      delayReason: '',
      billingStatus: 'PENDING',
      notes: '',
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (journey) => {
    setSelectedJourney(journey);
    setFormData({
      patientName: journey.patientName,
      department: journey.department,
      assignedDoctor: journey.assignedDoctor,
      admissionDate: new Date(journey.admissionDate).toISOString().split('T')[0],
      currentStage: journey.currentStage,
      pendingTests: journey.pendingTests || '',
      expectedDischargeDate: journey.expectedDischargeDate ? new Date(journey.expectedDischargeDate).toISOString().split('T')[0] : '',
      delayReason: journey.delayReason || '',
      billingStatus: journey.billingStatus,
      notes: journey.notes || '',
    });
    setShowEditModal(true);
  };

  const handleOpenDetailModal = (journey) => {
    setSelectedJourney(journey);
    setShowDetailModal(true);
  };

  const handleOpenDeleteModal = (journey) => {
    setSelectedJourney(journey);
    setShowDeleteModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/patient-journeys', formData);
      if (res.data.success) {
        setShowAddModal(false);
        setSuccess('Patient journey added successfully!');
        fetchJourneys();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create patient journey');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`/api/patient-journeys/${selectedJourney.id}`, formData);
      if (res.data.success) {
        setShowEditModal(false);
        setSuccess('Patient journey updated successfully!');
        fetchJourneys();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update patient journey');
    }
  };

  const handleDeleteSubmit = async () => {
    try {
      const res = await axios.delete(`/api/patient-journeys/${selectedJourney.id}`);
      if (res.data.success) {
        setShowDeleteModal(false);
        setSuccess('Patient journey deleted successfully!');
        fetchJourneys();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      alert('Failed to delete patient journey');
    }
  };

  const triggerExport = () => {
    // Simulated export
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Patient ID", "Name", "Department", "Doctor", "Admission Date", "Stage", "Billing Status"].join(",") + "\n"
      + journeys.map(j => [j.maskedPatientId, j.patientName, j.department, j.assignedDoctor, j.admissionDate, j.currentStage, j.billingStatus].join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "patient_journeys_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Patient Journey Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track patient movement, clinical stages, and billing approvals.</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={triggerExport}
            className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-hospital-500 hover:bg-hospital-600 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Patient Journey</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center space-x-2.5 text-sm">
          <Check className="h-5 w-5 text-emerald-600" />
          <span className="font-semibold">{success}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col xl:flex-row xl:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient name, ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-hospital-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Department */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-600 focus:outline-none"
            >
              <option value="">All Departments</option>
              <option value="General Medicine">General Medicine</option>
              <option value="Emergency">Emergency</option>
              <option value="ICU">ICU</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Neurology">Neurology</option>
              <option value="Pediatrics">Pediatrics</option>
            </select>
          </div>

          {/* Stage */}
          <select
            value={stageFilter}
            onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-600 focus:outline-none"
          >
            <option value="">All Stages</option>
            {stages.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Billing */}
          <select
            value={billingFilter}
            onChange={(e) => { setBillingFilter(e.target.value); setPage(1); }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-600 focus:outline-none"
          >
            <option value="">All Billing Statuses</option>
            {billingStatuses.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Masked Patient ID</th>
                <th className="px-6 py-4">Patient Name</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Assigned Doctor</th>
                <th className="px-6 py-4">Admission Date</th>
                <th className="px-6 py-4">Treatment Stage</th>
                <th className="px-6 py-4">Billing Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                    Refreshing records...
                  </td>
                </tr>
              ) : journeys.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                    No matching patient journeys found.
                  </td>
                </tr>
              ) : (
                journeys.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/55 transition-colors">
                    <td className="px-6 py-4 font-bold text-hospital-500">{j.maskedPatientId}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{j.patientName}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{j.department}</td>
                    <td className="px-6 py-4 text-slate-500">{j.assignedDoctor}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(j.admissionDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full uppercase
                        ${j.currentStage === 'DISCHARGE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          j.currentStage === 'REGISTRATION' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                          'bg-blue-50 text-hospital-600 border border-blue-100'}
                      `}>
                        {j.currentStage}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full
                        ${j.billingStatus === 'CLEARED' ? 'bg-emerald-50 text-emerald-600' : 
                          j.billingStatus === 'PENDING' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}
                      `}>
                        {j.billingStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenDetailModal(j)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(j)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(j)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Showing <span className="font-semibold">{journeys.length}</span> of <span className="font-semibold">{total}</span> journeys
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

      {/* ================= ADD MODAL ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:bg-slate-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add Patient Journey</h2>
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Patient Name</label>
                  <input
                    type="text"
                    required
                    value={formData.patientName}
                    onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-hospital-500"
                    placeholder="Patient Name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Doctor</label>
                  <input
                    type="text"
                    required
                    value={formData.assignedDoctor}
                    onChange={(e) => setFormData({...formData, assignedDoctor: e.target.value})}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-hospital-500"
                    placeholder="Dr. John Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-hospital-500"
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Emergency">Emergency</option>
                    <option value="ICU">ICU</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Pediatrics">Pediatrics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Admission Date</label>
                  <input
                    type="date"
                    required
                    value={formData.admissionDate}
                    onChange={(e) => setFormData({...formData, admissionDate: e.target.value})}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-hospital-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Treatment Stage</label>
                  <select
                    value={formData.currentStage}
                    onChange={(e) => setFormData({...formData, currentStage: e.target.value})}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    {stages.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Billing Status</label>
                  <select
                    value={formData.billingStatus}
                    onChange={(e) => setFormData({...formData, billingStatus: e.target.value})}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    {billingStatuses.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pending Tests (Optional)</label>
                  <input
                    type="text"
                    value={formData.pendingTests}
                    onChange={(e) => setFormData({...formData, pendingTests: e.target.value})}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    placeholder="e.g. ECG, CBC"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expected Discharge Date</label>
                  <input
                    type="date"
                    value={formData.expectedDischargeDate}
                    onChange={(e) => setFormData({...formData, expectedDischargeDate: e.target.value})}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Delay Reason (If applicable)</label>
                <input
                  type="text"
                  value={formData.delayReason}
                  onChange={(e) => setFormData({...formData, delayReason: e.target.value})}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  placeholder="e.g. Awaiting insurance review"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  placeholder="Additional patient details..."
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-hospital-500 hover:bg-hospital-600 text-white font-bold text-xs rounded-xl"
                >
                  Save Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL ================= */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:bg-slate-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Edit Patient Journey: <span className="text-hospital-500 font-bold">{selectedJourney?.maskedPatientId}</span></h2>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Patient Name</label>
                  <input
                    type="text"
                    required
                    value={formData.patientName}
                    onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Doctor</label>
                  <input
                    type="text"
                    required
                    value={formData.assignedDoctor}
                    onChange={(e) => setFormData({...formData, assignedDoctor: e.target.value})}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Emergency">Emergency</option>
                    <option value="ICU">ICU</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Pediatrics">Pediatrics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Admission Date</label>
                  <input
                    type="date"
                    required
                    value={formData.admissionDate}
                    onChange={(e) => setFormData({...formData, admissionDate: e.target.value})}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Treatment Stage</label>
                  <select
                    value={formData.currentStage}
                    onChange={(e) => setFormData({...formData, currentStage: e.target.value})}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    {stages.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Billing Status</label>
                  <select
                    value={formData.billingStatus}
                    onChange={(e) => setFormData({...formData, billingStatus: e.target.value})}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  >
                    {billingStatuses.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pending Tests (Optional)</label>
                  <input
                    type="text"
                    value={formData.pendingTests}
                    onChange={(e) => setFormData({...formData, pendingTests: e.target.value})}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expected Discharge Date</label>
                  <input
                    type="date"
                    value={formData.expectedDischargeDate}
                    onChange={(e) => setFormData({...formData, expectedDischargeDate: e.target.value})}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Delay Reason (If applicable)</label>
                <input
                  type="text"
                  value={formData.delayReason}
                  onChange={(e) => setFormData({...formData, delayReason: e.target.value})}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-hospital-500 hover:bg-hospital-600 text-white font-bold text-xs rounded-xl"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DETAIL MODAL ================= */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowDetailModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:bg-slate-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h2 className="text-lg font-bold text-slate-900 mb-6">Patient Journey Record</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase">Patient ID</span>
                <span className="text-sm font-bold text-hospital-500">{selectedJourney?.maskedPatientId}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase">Patient Name</span>
                <span className="text-sm font-bold text-slate-800">{selectedJourney?.patientName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase">Department</span>
                <span className="text-sm font-semibold text-slate-700">{selectedJourney?.department}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase">Assigned Doctor</span>
                <span className="text-sm font-medium text-slate-600">{selectedJourney?.assignedDoctor}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase">Admission Date</span>
                <span className="text-sm text-slate-600">
                  {new Date(selectedJourney?.admissionDate).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase">Expected Discharge</span>
                <span className="text-sm text-slate-600">
                  {selectedJourney?.expectedDischargeDate 
                    ? new Date(selectedJourney.expectedDischargeDate).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })
                    : 'Not specified'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase">Treatment Stage</span>
                <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-50 text-hospital-600 rounded-full border border-blue-100">
                  {selectedJourney?.currentStage}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase">Billing Status</span>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full
                  ${selectedJourney?.billingStatus === 'CLEARED' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}
                `}>
                  {selectedJourney?.billingStatus}
                </span>
              </div>

              {selectedJourney?.pendingTests && (
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Pending Tests</span>
                  <p className="text-xs font-semibold text-slate-700">{selectedJourney.pendingTests}</p>
                </div>
              )}

              {selectedJourney?.delayReason && (
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Delay Reason</span>
                  <p className="text-xs font-semibold text-amber-600">{selectedJourney.delayReason}</p>
                </div>
              )}

              {selectedJourney?.notes && (
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Clinical Notes</span>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 rounded-2xl p-3">
                    {selectedJourney.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-center">
            <div className="mx-auto h-12 w-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            
            <h2 className="text-lg font-bold text-slate-900 mb-2">Delete Patient Journey</h2>
            <p className="text-xs text-slate-500 leading-normal mb-6">
              Are you sure you want to delete patient journey record for <span className="font-bold text-slate-800">{selectedJourney?.patientName} ({selectedJourney?.maskedPatientId})</span>? This action cannot be undone.
            </p>

            <div className="flex space-x-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientJourney;
