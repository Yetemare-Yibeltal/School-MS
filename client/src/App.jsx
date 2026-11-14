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

const StudentsPage = lazy(() => import('./pages/students/StudentsPage'));
const StudentDetailPage = lazy(() => import('./pages/students/StudentDetailPage'));
const AddStudentPage = lazy(() => import('./pages/students/AddStudentPage'));
const EditStudentPage = lazy(() => import('./pages/students/EditStudentPage'));

const STUDENT_VIEW = ['super_admin', 'admin', 'teacher', 'receptionist', 'accountant', 'librarian'];
const STUDENT_EDIT = ['super_admin', 'admin', 'receptionist'];

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

        <Route
          path="/students"
          element={
            <ProtectedRoute roles={STUDENT_VIEW}>
              <StudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/new"
          element={
            <ProtectedRoute roles={STUDENT_EDIT}>
              <AddStudentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/:id"
          element={
            <ProtectedRoute roles={STUDENT_VIEW}>
              <StudentDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/:id/edit"
          element={
            <ProtectedRoute roles={STUDENT_EDIT}>
              <EditStudentPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Suspense>
);

export default App;
