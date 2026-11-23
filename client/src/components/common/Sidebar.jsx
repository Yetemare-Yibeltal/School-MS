import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const ADMIN = ['super_admin', 'admin'];
const HR = [...ADMIN, 'hr_manager'];
const FIN = [...ADMIN, 'accountant'];
const STAFF = [...ADMIN, 'teacher', 'receptionist'];
const TEACH = [...ADMIN, 'teacher'];
const LIB = [...ADMIN, 'librarian'];

const SECTIONS = [
  {
    title: 'Main',
    links: [{ to: '/dashboard', icon: '🏠', label: 'Dashboard', roles: null }],
  },
  {
    title: 'People',
    links: [
      {
        to: '/students',
        icon: '🎓',
        label: 'Students',
        roles: [...ADMIN, 'teacher', 'receptionist', 'accountant', 'librarian'],
      },
      { to: '/teachers', icon: '👨‍🏫', label: 'Teachers', roles: HR },
      { to: '/employees', icon: '👔', label: 'Employees', roles: HR },
    ],
  },
  {
    title: 'Academic',
    links: [
      { to: '/academic/years', icon: '📅', label: 'Academic Years', roles: ADMIN },
      { to: '/academic/classes', icon: '🏛️', label: 'Classes', roles: STAFF },
      { to: '/academic/sections', icon: '🚪', label: 'Sections', roles: STAFF },
      { to: '/academic/subjects', icon: '📖', label: 'Subjects', roles: null },
      { to: '/academic/timetable', icon: '⏰', label: 'Timetable', roles: null },
      { to: '/attendance', icon: '✅', label: 'Attendance', roles: STAFF },
      { to: '/attendance/report', icon: '📊', label: 'Attendance Reports', roles: STAFF },
      { to: '/exams', icon: '📝', label: 'Exams', roles: TEACH },
      { to: '/report-cards', icon: '📋', label: 'Report Cards', roles: TEACH },
    ],
  },
  {
    title: 'Finance',
    links: [
      { to: '/finance', icon: '💰', label: 'Finance Dashboard', roles: FIN, end: true },
      { to: '/finance/fee-collection', icon: '💳', label: 'Fee Collection', roles: FIN },
      { to: '/finance/fee-types', icon: '🏷️', label: 'Fee Types', roles: FIN },
      { to: '/finance/payments', icon: '🧾', label: 'Payments', roles: FIN },
      { to: '/finance/income', icon: '📈', label: 'Income', roles: FIN },
      { to: '/finance/expenses', icon: '📉', label: 'Expenses', roles: FIN },
    ],
  },
  {
    title: 'HRM',
    links: [
      { to: '/hrm', icon: '🏢', label: 'HR Dashboard', roles: HR, end: true },
      { to: '/hrm/departments', icon: '🗂️', label: 'Departments', roles: HR },
      { to: '/hrm/payroll', icon: '💼', label: 'Payroll', roles: HR },
      { to: '/hrm/leaves', icon: '🏖️', label: 'Leaves', roles: HR },
    ],
  },
  {
    title: 'Library',
    links: [
      { to: '/library', icon: '📚', label: 'Library Dashboard', roles: LIB, end: true },
      { to: '/library/books', icon: '📕', label: 'Books', roles: LIB },
      { to: '/library/issues', icon: '🔄', label: 'Issue / Return', roles: LIB },
      { to: '/library/members', icon: '👥', label: 'Members', roles: LIB },
    ],
  },
  {
    title: 'More',
    links: [
      { to: '/notices', icon: '📢', label: 'Notices', roles: null },
      { to: '/ai/assistant', icon: '🤖', label: 'AI Assistant', roles: null },
      { to: '/settings', icon: '⚙️', label: 'Settings', roles: ADMIN },
    ],
  },
];

const Sidebar = ({ onNavigate }) => {
  const { user, logout } = useAuthStore();
  const allowed = (l) => !l.roles || l.roles.includes(user?.role);

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

      <nav className="flex-1 overflow-y-auto p-2 no-scrollbar">
        {SECTIONS.map((s) => {
          const links = s.links.filter(allowed);
          if (links.length === 0) {
            return null;
          }
          return (
            <div key={s.title} className="mb-2">
              <p className="px-3 pt-3 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {s.title}
              </p>
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  <span className="text-base">{l.icon}</span>
                  {l.label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <p className="text-sm font-medium text-slate-900 truncate">
          {user?.firstName} {user?.fatherName}
        </p>
        <p className="text-xs text-slate-500 capitalize mb-2">{user?.role?.replace('_', ' ')}</p>
        <button type="button" onClick={logout} className="btn-outline btn-sm w-full">
          Sign out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
