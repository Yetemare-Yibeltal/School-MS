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

const TeachersPage = lazy(() => import('./pages/teachers/TeachersPage'));
const TeacherDetailPage = lazy(() => import('./pages/teachers/TeacherDetailPage'));
const AddTeacherPage = lazy(() => import('./pages/teachers/AddTeacherPage'));
const EditTeacherPage = lazy(() => import('./pages/teachers/EditTeacherPage'));

const EmployeesPage = lazy(() => import('./pages/employees/EmployeesPage'));
const EmployeeDetailPage = lazy(() => import('./pages/employees/EmployeeDetailPage'));
const AddEmployeePage = lazy(() => import('./pages/employees/AddEmployeePage'));
const EditEmployeePage = lazy(() => import('./pages/employees/EditEmployeePage'));

const AcademicYearsPage = lazy(() => import('./pages/academic/AcademicYearsPage'));
const SubjectsPage = lazy(() => import('./pages/academic/SubjectsPage'));
const ClassesPage = lazy(() => import('./pages/academic/ClassesPage'));
const SectionsPage = lazy(() => import('./pages/academic/SectionsPage'));
const TimetablePage = lazy(() => import('./pages/academic/TimetablePage'));

const HRMDashboardPage = lazy(() => import('./pages/hrm/HRMDashboardPage'));
const DepartmentsPage = lazy(() => import('./pages/hrm/DepartmentsPage'));
const PayrollPage = lazy(() => import('./pages/hrm/PayrollPage'));
const LeavesPage = lazy(() => import('./pages/hrm/LeavesPage'));

const AttendancePage = lazy(() => import('./pages/attendance/AttendancePage'));
const AttendanceReportPage = lazy(() => import('./pages/attendance/AttendanceReportPage'));

const ExamsPage = lazy(() => import('./pages/exams/ExamsPage'));
const AddExamPage = lazy(() => import('./pages/exams/AddExamPage'));
const ExamDetailPage = lazy(() => import('./pages/exams/ExamDetailPage'));
const EnterResultsPage = lazy(() => import('./pages/exams/EnterResultsPage'));
const ReportCardsPage = lazy(() => import('./pages/exams/ReportCardsPage'));

const FinanceDashboardPage = lazy(() => import('./pages/finance/FinanceDashboardPage'));
const FeeCollectionPage = lazy(() => import('./pages/finance/FeeCollectionPage'));
const FeeTypesPage = lazy(() => import('./pages/finance/FeeTypesPage'));
const PaymentsPage = lazy(() => import('./pages/finance/PaymentsPage'));
const IncomePage = lazy(() => import('./pages/finance/IncomePage'));
const ExpensesPage = lazy(() => import('./pages/finance/ExpensesPage'));

const LibraryDashboardPage = lazy(() => import('./pages/library/LibraryDashboardPage'));
const BooksPage = lazy(() => import('./pages/library/BooksPage'));
const BookIssuePage = lazy(() => import('./pages/library/BookIssuePage'));
const LibraryMembersPage = lazy(() => import('./pages/library/LibraryMembersPage'));

const NoticesPage = lazy(() => import('./pages/communications/NoticesPage'));
const EventsPage = lazy(() => import('./pages/communications/EventsPage'));
const MessagesPage = lazy(() => import('./pages/communications/MessagesPage'));
const SuspensionsPage = lazy(() => import('./pages/communications/SuspensionsPage'));

const ADMIN = ['super_admin', 'admin'];
const STUDENT_VIEW = [...ADMIN, 'teacher', 'receptionist', 'accountant', 'librarian'];
const STUDENT_EDIT = [...ADMIN, 'receptionist'];
const HR = [...ADMIN, 'hr_manager'];
const STAFF = [...ADMIN, 'teacher', 'receptionist'];
const TEACHER = [...ADMIN, 'teacher'];
const FINANCE = [...ADMIN, 'accountant'];
const LIBRARY = [...ADMIN, 'librarian'];

const guard = (roles, element) => <ProtectedRoute roles={roles}>{element}</ProtectedRoute>;

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

        <Route path="/students" element={guard(STUDENT_VIEW, <StudentsPage />)} />
        <Route path="/students/new" element={guard(STUDENT_EDIT, <AddStudentPage />)} />
        <Route path="/students/:id" element={guard(STUDENT_VIEW, <StudentDetailPage />)} />
        <Route path="/students/:id/edit" element={guard(STUDENT_EDIT, <EditStudentPage />)} />

        <Route path="/teachers" element={guard(HR, <TeachersPage />)} />
        <Route path="/teachers/new" element={guard(HR, <AddTeacherPage />)} />
        <Route path="/teachers/:id" element={guard(HR, <TeacherDetailPage />)} />
        <Route path="/teachers/:id/edit" element={guard(HR, <EditTeacherPage />)} />

        <Route path="/employees" element={guard(HR, <EmployeesPage />)} />
        <Route path="/employees/new" element={guard(HR, <AddEmployeePage />)} />
        <Route path="/employees/:id" element={guard(HR, <EmployeeDetailPage />)} />
        <Route path="/employees/:id/edit" element={guard(HR, <EditEmployeePage />)} />

        <Route path="/academic/years" element={guard(ADMIN, <AcademicYearsPage />)} />
        <Route path="/academic/classes" element={guard(STAFF, <ClassesPage />)} />
        <Route path="/academic/sections" element={guard(STAFF, <SectionsPage />)} />
        <Route path="/academic/subjects" element={<SubjectsPage />} />
        <Route path="/academic/timetable" element={<TimetablePage />} />

        <Route path="/hrm" element={guard(HR, <HRMDashboardPage />)} />
        <Route path="/hrm/departments" element={guard(HR, <DepartmentsPage />)} />
        <Route path="/hrm/payroll" element={guard(HR, <PayrollPage />)} />
        <Route path="/hrm/leaves" element={guard(HR, <LeavesPage />)} />

        <Route path="/attendance" element={guard(STAFF, <AttendancePage />)} />
        <Route path="/attendance/report" element={guard(STAFF, <AttendanceReportPage />)} />

        <Route path="/exams" element={guard(TEACHER, <ExamsPage />)} />
        <Route path="/exams/new" element={guard(TEACHER, <AddExamPage />)} />
        <Route path="/exams/:id" element={guard(TEACHER, <ExamDetailPage />)} />
        <Route path="/exams/:id/results" element={guard(TEACHER, <EnterResultsPage />)} />
        <Route path="/report-cards" element={guard(TEACHER, <ReportCardsPage />)} />

        <Route path="/finance" element={guard(FINANCE, <FinanceDashboardPage />)} />
        <Route path="/finance/fee-collection" element={guard(FINANCE, <FeeCollectionPage />)} />
        <Route path="/finance/fee-types" element={guard(FINANCE, <FeeTypesPage />)} />
        <Route path="/finance/payments" element={guard(FINANCE, <PaymentsPage />)} />
        <Route path="/finance/income" element={guard(FINANCE, <IncomePage />)} />
        <Route path="/finance/expenses" element={guard(FINANCE, <ExpensesPage />)} />

        <Route path="/library" element={guard(LIBRARY, <LibraryDashboardPage />)} />
        <Route path="/library/books" element={guard(LIBRARY, <BooksPage />)} />
        <Route path="/library/issues" element={guard(LIBRARY, <BookIssuePage />)} />
        <Route path="/library/members" element={guard(LIBRARY, <LibraryMembersPage />)} />

        <Route path="/notices" element={<NoticesPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/suspensions" element={guard(STAFF, <SuspensionsPage />)} />
      </Route>

      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Suspense>
);

export default App;
