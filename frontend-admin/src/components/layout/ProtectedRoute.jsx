import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { hasPermission } from '../../utils/permissions';

export default function ProtectedRoute({ children, permissions = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (permissions.length && !hasPermission(user.permissions, user.role, permissions)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
