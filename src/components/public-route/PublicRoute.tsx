import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getDestinationForRole } from '@/services/auth/roleRedirect';
import type { ReactNode } from 'react';

interface PublicRouteProps {
  children: ReactNode;
  allowWhenAuthenticated?: boolean;
}

export default function PublicRoute({ children, allowWhenAuthenticated = false }: PublicRouteProps) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!allowWhenAuthenticated && isAuthenticated && user) {
    const destination = getDestinationForRole(user.role);
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
}
