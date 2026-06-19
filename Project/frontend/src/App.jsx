import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import HospitalExecutive from './pages/HospitalExecutive';
import IcuOperations from './pages/IcuOperations';
import EmergencyRoom from './pages/EmergencyRoom';
import PatientJourney from './pages/PatientJourney';
import DoctorProductivity from './pages/DoctorProductivity';
import FinancialDashboard from './pages/FinancialDashboard';
import AlertsCenter from './pages/AlertsCenter';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Register from './pages/Register';

// Protected Route Guard with Role checking
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-b-hospital-500 rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized role to the first route they have access to
    if (user.role === 'CMO') {
      return <Navigate to="/icu" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route Guard (prevent logged-in users from seeing login/register)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-b-hospital-500 rounded-full"></div>
      </div>
    );
  }

  if (user) {
    if (user.role === 'CMO') {
      return <Navigate to="/icu" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Pages */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Secure Dashboard Shell */}
          <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
            <Route index element={
              <PrivateRoute allowedRoles={['ADMIN', 'CEO', 'OPERATIONS_HEAD']}>
                <HospitalExecutive />
              </PrivateRoute>
            } />
            <Route path="icu" element={
              <PrivateRoute allowedRoles={['ADMIN', 'CMO', 'OPERATIONS_HEAD']}>
                <IcuOperations />
              </PrivateRoute>
            } />
            <Route path="emergency" element={
              <PrivateRoute allowedRoles={['ADMIN', 'CMO', 'OPERATIONS_HEAD']}>
                <EmergencyRoom />
              </PrivateRoute>
            } />
            <Route path="patient-journey" element={
              <PrivateRoute allowedRoles={['ADMIN', 'CMO', 'OPERATIONS_HEAD']}>
                <PatientJourney />
              </PrivateRoute>
            } />
            <Route path="doctor-productivity" element={
              <PrivateRoute allowedRoles={['ADMIN', 'CMO']}>
                <DoctorProductivity />
              </PrivateRoute>
            } />
            <Route path="financial" element={
              <PrivateRoute allowedRoles={['ADMIN', 'CEO']}>
                <FinancialDashboard />
              </PrivateRoute>
            } />
            <Route path="alerts" element={
              <PrivateRoute allowedRoles={['ADMIN', 'CMO', 'OPERATIONS_HEAD']}>
                <AlertsCenter />
              </PrivateRoute>
            } />
            <Route path="reports" element={
              <PrivateRoute allowedRoles={['ADMIN', 'CEO', 'CMO', 'OPERATIONS_HEAD']}>
                <Reports />
              </PrivateRoute>
            } />
            <Route path="settings" element={
              <PrivateRoute allowedRoles={['ADMIN', 'CEO', 'CMO', 'OPERATIONS_HEAD']}>
                <Settings />
              </PrivateRoute>
            } />
            <Route path="admin" element={
              <PrivateRoute allowedRoles={['ADMIN']}>
                <AdminPanel />
              </PrivateRoute>
            } />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
