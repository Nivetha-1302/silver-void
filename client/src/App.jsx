import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import faceHandler from './utils/faceHandler';
import LandingPage from './components/LandingPage/LandingPage';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import EmployeeWorkspace from './components/Workspace/EmployeeWorkspace';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import EmployeeManagement from './components/HR/EmployeeManagement';
import AttendanceDashboard from './components/HR/AttendanceDashboard';
import TaskManager from './components/HR/TaskManager';
import LiveFeed from './components/Dashboard/LiveFeed';
import SecuritySystem from './components/Dashboard/SecuritySystem';
import VirtualZoneDashboard from './components/Dashboard/VirtualZoneDashboard';
import Settings from './components/Dashboard/Settings';
import MobileCamera from './components/Dashboard/MobileCamera';
import SupportCenter from './components/Dashboard/SupportCenter';
import ScreenGallery from './components/Dashboard/ScreenGallery';
import PayrollDashboard from './components/Finance/PayrollDashboard';
import InvoiceGenerator from './components/Finance/InvoiceGenerator';
import { Toaster } from 'react-hot-toast';
import WorkTimeDashboard from './components/Dashboard/WorkTimeDashboard';
import Reports from './components/Dashboard/Reports';
import AdminLayout from './components/Dashboard/AdminLayout'; // Import Layout

// Wrapper to apply layout only to Admin Routes
const AppLayout = ({ children }) => {
  const location = useLocation();
  // Routes that should NOT have the sidebar
  const noLayoutRoutes = ['/login', '/register', '/mobile-cam', '/workspace', '/'];

  const showLayout = !noLayoutRoutes.includes(location.pathname);

  if (showLayout) {
    return <AdminLayout>{children}</AdminLayout>;
  }
  return children;
};

import { AnimatePresence } from 'framer-motion';

// Inner component to handle routing and animations
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/workspace" element={<EmployeeWorkspace />} />

          {/* Admin Routes - Now automatically wrapped by AppLayout */}
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/productivity" element={<WorkTimeDashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/hr" element={<EmployeeManagement />} />
          <Route path="/attendance" element={<AttendanceDashboard />} />
          <Route path="/tasks" element={<TaskManager />} />
          <Route path="/live-feed" element={<LiveFeed />} />
          <Route path="/security" element={<SecuritySystem />} />
          <Route path="/zones" element={<VirtualZoneDashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/gallery" element={<ScreenGallery />} />
          <Route path="/support" element={<SupportCenter />} />

          {/* New Finance Routes */}
          <Route path="/payroll" element={<PayrollDashboard />} />
          <Route path="/invoices" element={<InvoiceGenerator />} />

          {/* Standalone Route */}
          <Route path="/mobile-cam" element={<MobileCamera />} />

          <Route path="*" element={<div className="p-10 text-center">404 Not Found</div>} />
        </Routes>
      </AnimatePresence>
    </AppLayout>
  );
};

function App() {
  useEffect(() => {
    faceHandler.loadAll().catch(console.error);
  }, []);

  return (
    <Router>
      <div className="min-h-screen text-slate-800 font-sans bg-transparent">
        <AnimatedRoutes />
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;
