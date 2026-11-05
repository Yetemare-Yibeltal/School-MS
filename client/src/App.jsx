import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';
import PageLoader from './components/common/PageLoader';

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const NotFoundPage = lazy(() => import('./pages/errors/NotFoundPage'));
const UnauthorizedPage = lazy(() => import('./pages/errors/UnauthorizedPage'));

const App = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>

      <Route path="/unauthorized" element={<UnauthorizedPage />} />

    </Routes>
  </Suspense>
);

export default App;
