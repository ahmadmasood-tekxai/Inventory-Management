import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { ROUTES } from '@/constants';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { CashPage } from '@/pages/Cash/CashPage';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { ExpensesPage } from '@/pages/Expenses/ExpensesPage';
import { ItemDetailPage } from '@/pages/Items/ItemDetailPage';
import { ItemsListPage } from '@/pages/Items/ItemsListPage';
import { SalesPage } from '@/pages/Items/SalesPage';
import { NotificationsPage } from '@/pages/Notifications/NotificationsPage';
import { PurchasesPage } from '@/pages/Purchases/PurchasesPage';
import { LoginPage } from '@/pages/Auth/LoginPage';
import { SetupPage } from '@/pages/Setup/SetupPage';
import { apiClient } from '@/api/client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

/**
 * FirstRunGuard — checks admin-exists once on startup.
 * If no users exist, redirects to /setup before showing anything else.
 */
function FirstRunGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    apiClient
      .get('/auth/admin-exists')
      .then((res) => {
        if (!res.data.exists) {
          navigate('/setup', { replace: true });
        }
      })
      .catch(() => {
        // Backend not yet ready or network error — silently continue to login
      })
      .finally(() => setChecked(true));
  }, [navigate]);

  if (!checked) {
    // Minimal loading screen while we check
    return (
      <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(245,158,11,0.2)', borderTop: '3px solid #f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <FirstRunGuard>
            <Routes>
              {/* First-run setup (no auth needed) */}
              <Route path="/setup" element={<SetupPage />} />
              <Route path={ROUTES.LOGIN} element={<LoginPage />} />

              <Route
                path={ROUTES.DASHBOARD}
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.ITEMS}
                element={
                  <ProtectedRoute>
                    <ItemsListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.ITEM_DETAIL()}
                element={
                  <ProtectedRoute>
                    <ItemDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.SALES}
                element={
                  <ProtectedRoute>
                    <SalesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.EXPENSES}
                element={
                  <ProtectedRoute>
                    <ExpensesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.CASH}
                element={
                  <ProtectedRoute>
                    <CashPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.PURCHASES}
                element={
                  <ProtectedRoute>
                    <PurchasesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.NOTIFICATIONS}
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            </Routes>
            </FirstRunGuard>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
