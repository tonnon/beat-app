import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getDestinationForRole, normalizeRole } from '@/services/auth/roleRedirect';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const allowedRolesNormalized = allowedRoles?.map((role) => normalizeRole(role));
  const userRole = user?.role ? normalizeRole(user.role) : null;

  if (allowedRolesNormalized?.length) {
    if (!userRole || !allowedRolesNormalized.includes(userRole)) {
      const fallbackDestination = user ? getDestinationForRole(user.role) : '/';
      return <Navigate to={fallbackDestination} replace />;
    }
  }

  return <>{children}</>;
}
