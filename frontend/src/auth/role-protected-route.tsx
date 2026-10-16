import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './use-auth';

type RoleProtectedRouteProps = {
  allowedRoles: string[];
};

export function RoleProtectedRoute({
  allowedRoles,
}: RoleProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
