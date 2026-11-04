import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const LINKS = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard', roles: null },
  {
    to: '/students',
    icon: '🎓',
    label: 'Students',
    roles: ['super_admin', 'admin', 'teacher', 'receptionist', 'accountant', 'librarian'],
  },
  { to: '/teachers', icon: '👨‍🏫', label: 'Teachers', roles: ['super_admin', 'admin', 'hr_manager'] },
  {
    to: '/employees',
    icon: '👔',
    label: 'Employees',
    roles: ['super_admin', 'admin', 'hr_manager'],
  },
  { to: '/academic/years', icon: '📅', label: 'Academic Years', roles: ['super_admin', 'admin'] },
  { to: '/academic/subjects', icon: '📖', label: 'Subjects', roles: null },
  {
    to: '/attendance',
    icon: '✅',
    label: 'Attendance',
    roles: ['super_admin', 'admin', 'teacher', 'receptionist'],
  },
  { to: '/exams', icon: '📝', label: 'Exams', roles: ['super_admin', 'admin', 'teacher'] },
  { to: '/finance', icon: '💰', label: 'Finance', roles: ['super_admin', 'admin', 'accountant'] },
  { to: '/hrm', icon: '🏢', label: 'HRM', roles: ['super_admin', 'admin', 'hr_manager'] },
  { to: '/library', icon: '📚', label: 'Library', roles: ['super_admin', 'admin', 'librarian'] },
  { to: '/notices', icon: '📢', label: 'Notices', roles: null },
  { to: '/ai/assistant', icon: '🤖', label: 'AI Assistant', roles: null },
  { to: '/settings', icon: '⚙️', label: 'Settings', roles: ['super_admin', 'admin'] },
];

const Sidebar = ({ onNavigate }) => {
  const { user, logout } = useAuthStore();
  const links = LINKS.filter((l) => !l.roles || l.roles.includes(user?.role));
  return (
    <div className="flex flex-col h-full">
      <div className="h-16 flex items-center px-4 border-b border-slate-100">
        <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
          K
        </div>
        <div className="ml-3">
          <p className="text-sm font-bold text-slate-900 leading-tight">Kat School</p>
          <p className="text-[11px] text-slate-500">Management System</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 no-scrollbar">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            <span className="text-lg">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-100 p-3">
        <p className="text-sm font-medium text-slate-900 truncate">
          {user?.firstName} {user?.fatherName}
        </p>
        <p className="text-xs text-slate-500 capitalize mb-2">{user?.role?.replace('_', ' ')}</p>
        <button onClick={logout} className="btn-outline btn-sm w-full">
          Sign out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
