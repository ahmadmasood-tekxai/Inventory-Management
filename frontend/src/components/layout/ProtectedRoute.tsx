import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { Loader } from '@/components/common/Loader';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Loader label="Checking session…" />;
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;

  return <>{children}</>;
}
