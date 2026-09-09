import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { ROUTES } from '@/constants';
import { AuthProvider } from '@/context/AuthContext';
import { CashPage } from '@/pages/Cash/CashPage';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { ExpensesPage } from '@/pages/Expenses/ExpensesPage';
import { ItemDetailPage } from '@/pages/Items/ItemDetailPage';
import { ItemsListPage } from '@/pages/Items/ItemsListPage';
import { SalesPage } from '@/pages/Items/SalesPage';
import { PurchasesPage } from '@/pages/Purchases/PurchasesPage';
import { LoginPage } from '@/pages/Auth/LoginPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
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

            <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
