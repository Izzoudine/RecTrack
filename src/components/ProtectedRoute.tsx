import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: ('admin' | 'user')[];
  requireDepartment?: boolean;
}

function ProtectedRoute({ children, allowedRoles}: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <div className="p-6 text-center">Chargement...</div>;
  }

  if (!session || !profile) {
    return <Navigate to="/login" replace />;
  }

  // Ensure role is 'admin' or 'user'
  const userRole = profile.role as 'admin' | 'user';

  if (!allowedRoles.includes(userRole)) {
    // Redirect to default page based on role
    return <Navigate to={userRole === 'admin' ? '/admin' : '/user'} replace />;
  }

  

  return <>{children}</>;
}

export default ProtectedRoute;