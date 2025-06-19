import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: ('admin' | 'user' | 'chief')[];
  requireDepartment?: boolean; // currently unused
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <div className="p-6 text-center">Chargement...</div>;
  }

  if (!session || !profile) {
    return <Navigate to="/login" replace />;
  }

  // Ensure role is one of the allowed roles
  const userRole = profile.role as 'admin' | 'user' | 'chief';

  if (!allowedRoles.includes(userRole)) {
    // Redirect based on role or fallback to login
    switch (userRole) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'user':
        return <Navigate to="/user" replace />;
      case 'chief':
        return <Navigate to="/chief" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}

export default ProtectedRoute;
