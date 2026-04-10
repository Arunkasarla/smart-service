import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AnimatePresence } from 'framer-motion';
import Navbar from '../components/layout/Navbar';

// Auth
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// User Pages
import Home from '../pages/user/Home';
import ServiceListing from '../pages/user/ServiceListing';
import BookingFlow from '../pages/user/BookingFlow';
import MyBookings from '../pages/user/MyBookings';

// Provider Pages
import ProviderDashboard from '../pages/provider/Dashboard';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import AdminLogin from '../pages/admin/AdminLogin';

// Payment
import Checkout from '../pages/payment/Checkout';
import Success from '../pages/payment/Success';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

const Layout = ({ children }) => (
  <div className="flex flex-col min-h-screen bg-background text-main transition-colors duration-300">
    <Navbar />
    <main className="flex-1 relative">
      {children}
    </main>
  </div>
);

const AppRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin-auth" element={<AdminLogin />} />
        
        {/* Public / User Routes */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/services" element={<Layout><ServiceListing /></Layout>} />
        
        {/* Protected User Routes */}
        <Route path="/book/:serviceId" element={
          <ProtectedRoute allowedRoles={['user']}><Layout><BookingFlow /></Layout></ProtectedRoute>
        } />
        <Route path="/my-bookings" element={
          <ProtectedRoute allowedRoles={['user']}><Layout><MyBookings /></Layout></ProtectedRoute>
        } />
        <Route path="/checkout" element={
          <ProtectedRoute allowedRoles={['user']}><Layout><Checkout /></Layout></ProtectedRoute>
        } />
        <Route path="/success" element={
          <ProtectedRoute allowedRoles={['user']}><Layout><Success /></Layout></ProtectedRoute>
        } />

        {/* Provider Routes */}
        <Route path="/provider" element={
          <ProtectedRoute allowedRoles={['provider']}><Layout><ProviderDashboard /></Layout></ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}><Layout><AdminDashboard /></Layout></ProtectedRoute>
        } />
      </Routes>
    </AnimatePresence>
  );
};

export default AppRoutes;
