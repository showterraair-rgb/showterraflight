import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import LoadingSkeleton from './LoadingSkeleton';

export default function ProtectedRoute() {
  const { agent, loading } = useAuthStore();
  if (loading) return <div className="p-8"><LoadingSkeleton rows={3} /></div>;
  if (!agent) return <Navigate to="/login" replace />;
  return <Outlet />;
}
