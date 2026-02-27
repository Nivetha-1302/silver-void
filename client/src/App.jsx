import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import faceHandler from './utils/faceHandler';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

// UI Components
import SuspenseLoader from './components/UI/SuspenseLoader';
import NotFound from './components/UI/NotFound';
import AdminLayout from './components/Dashboard/AdminLayout';

// Lazy loading the pages for significant performance enhancement
const LandingPage = lazy(() => import('./components/LandingPage/LandingPage'));
const Login = lazy(() => import('./components/Login/Login'));
const Register = lazy(() => import('./components/Register/Register'));
const EmployeeWorkspace = lazy(() => import('./components/Workspace/EmployeeWorkspace'));
const AdminDashboard = lazy(() => import('./components/Dashboard/AdminDashboard'));
const EmployeeManagement = lazy(() => import('./components/HR/EmployeeManagement'));
const AttendanceDashboard = lazy(() => import('./components/HR/AttendanceDashboard'));
const TaskManager = lazy(() => import('./components/HR/TaskManager'));
const LiveFeed = lazy(() => import('./components/Dashboard/LiveFeed'));
const SecuritySystem = lazy(() => import('./components/Dashboard/SecuritySystem'));
const VirtualZoneDashboard = lazy(() => import('./components/Dashboard/VirtualZoneDashboard'));
const VirtualZoneScanner = lazy(() => import('./components/Dashboard/VirtualZoneScanner'));
const GamificationBoard = lazy(() => import('./components/Dashboard/GamificationBoard'));
const Settings = lazy(() => import('./components/Dashboard/Settings'));
const MobileCamera = lazy(() => import('./components/Dashboard/MobileCamera'));
const SupportCenter = lazy(() => import('./components/Dashboard/SupportCenter'));
const ScreenGallery = lazy(() => import('./components/Dashboard/ScreenGallery'));
const PayrollDashboard = lazy(() => import('./components/Finance/PayrollDashboard'));
const InvoiceGenerator = lazy(() => import('./components/Finance/InvoiceGenerator'));
const WorkTimeDashboard = lazy(() => import('./components/Dashboard/WorkTimeDashboard'));
const Reports = lazy(() => import('./components/Dashboard/Reports'));
const Announcements = lazy(() => import('./components/Dashboard/Announcements'));

// Wrapper to apply layout only to Admin Routes
const AppLayout = ({ children }) => {
  const location = useLocation();
  // Routes that should NOT have the sidebar
  const noLayoutRoutes = ['/login', '/register', '/mobile-cam', '/workspace', '/', '/scanner'];

  const showLayout = !noLayoutRoutes.includes(location.pathname);

  if (showLayout) {
    return <AdminLayout>{children}</AdminLayout>;
  }
  return children;
};

// Inner component to handle routing and animations
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        <Suspense fallback={<SuspenseLoader />}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/workspace" element={<EmployeeWorkspace />} />

            {/* Admin Routes - Now automatically wrapped by AppLayout */}
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/productivity" element={<WorkTimeDashboard />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/leaderboard" element={<GamificationBoard />} />
            <Route path="/hr" element={<EmployeeManagement />} />
            <Route path="/attendance" element={<AttendanceDashboard />} />
            <Route path="/tasks" element={<TaskManager />} />
            <Route path="/live-feed" element={<LiveFeed />} />
            <Route path="/security" element={<SecuritySystem />} />
            <Route path="/zones" element={<VirtualZoneDashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/gallery" element={<ScreenGallery />} />
            <Route path="/support" element={<SupportCenter />} />

            {/* New Finance Routes */}
            <Route path="/payroll" element={<PayrollDashboard />} />
            <Route path="/invoices" element={<InvoiceGenerator />} />

            {/* Standalone Route */}
            <Route path="/mobile-cam" element={<MobileCamera />} />
            <Route path="/scanner" element={<VirtualZoneScanner />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
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
