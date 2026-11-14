import { useLocation } from 'react-router-dom';

import { useAuthStore } from '../../store/authStore';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/students': 'Students',
  '/teachers': 'Teachers',
  '/employees': 'Employees',
  '/academic/years': 'Academic Years',
  '/academic/subjects': 'Subjects',
  '/attendance': 'Attendance',
  '/exams': 'Examinations',
  '/finance': 'Finance',
  '/hrm': 'HRM',
  '/library': 'Library',
  '/notices': 'Notices',
  '/ai/assistant': 'AI Assistant',
  '/settings': 'Settings',
};

const Header = ({ onMenuClick }) => {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-4 px-4 md:px-6 flex-shrink-0">
      <button
        onClick={onMenuClick}
        className="btn-icon text-slate-500 hover:bg-slate-100 lg:hidden"
        aria-label="Menu"
      >
        ☰
      </button>
      <h1 className="flex-1 text-base font-semibold text-slate-900 truncate">
        {TITLES[pathname] || 'Kat School'}
      </h1>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm flex items-center justify-center">
          {user?.firstName?.[0]}
          {user?.fatherName?.[0]}
        </div>
        <span className="hidden sm:block text-sm text-slate-700">{user?.firstName}</span>
      </div>
    </header>
  );
};

export default Header;
