import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { useAuthStore } from './store/authStore';
import AgentLayout from './components/AgentLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import NewBookingPage from './pages/NewBookingPage';
import BookingsPage from './pages/BookingsPage';
import BookingDetailPage from './pages/BookingDetailPage';
import ReportsPage from './pages/ReportsPage';
import StatementPage from './pages/StatementPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';

function AppBootstrap({ children }) {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  useEffect(() => {
    fetchMe();
    const onUnauthorized = () => useAuthStore.getState().setAgent(null);
    window.addEventListener('agent:unauthorized', onUnauthorized);
    return () => window.removeEventListener('agent:unauthorized', onUnauthorized);
  }, [fetchMe]);
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppBootstrap>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AgentLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="bookings/new" element={<NewBookingPage />} />
                <Route path="bookings" element={<BookingsPage />} />
                <Route path="bookings/:id" element={<BookingDetailPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="statement" element={<StatementPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="notifications" element={<NotificationsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppBootstrap>
      </ToastProvider>
    </BrowserRouter>
  );
}
