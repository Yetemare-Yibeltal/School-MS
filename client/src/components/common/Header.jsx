import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/students': 'Students',
  '/teachers': 'Teachers',
  '/employees': 'Employees',
  '/academic/years': 'Academic Years',
  '/academic/classes': 'Classes',
  '/academic/sections': 'Sections',
  '/academic/subjects': 'Subjects',
  '/academic/timetable': 'Timetable',
  '/attendance': 'Attendance',
  '/attendance/report': 'Attendance Reports',
  '/exams': 'Examinations',
  '/report-cards': 'Report Cards',
  '/finance': 'Finance',
  '/hrm': 'HRM',
  '/library': 'Library',
  '/notices': 'Notices',
  '/events': 'Events',
  '/messages': 'Messages',
  '/suspensions': 'Suspensions',
  '/ai/assistant': 'AI Assistant',
  '/ai/notice': 'AI Notice Writer',
  '/settings': 'Settings',
  '/audit-logs': 'Audit Logs',
  '/profile': 'My Profile',
};

const titleFor = (path) => {
  if (TITLES[path]) return TITLES[path];
  const hit = Object.keys(TITLES)
    .filter((k) => k !== '/' && path.startsWith(`${k}/`))
    .sort((a, b) => b.length - a.length)[0];
  return hit ? TITLES[hit] : 'Kat School';
};

const Bell = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/communications/notifications?limit=8')).data.data,
    refetchInterval: 60000,
  });
  const items = data?.notifications || [];
  const unread = data?.unreadCount || 0;

  const readAll = useMutation({
    mutationFn: () => api.post('/communications/notifications/mark-all-read'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const readOne = useMutation({
    mutationFn: (id) => api.patch(`/communications/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="btn-icon text-slate-500 hover:bg-slate-100 relative"
        aria-label="Notifications"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                className="text-xs text-indigo-600"
                onClick={() => readAll.mutate()}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {items.length === 0 && (
              <p className="p-6 text-center text-sm text-slate-400">No notifications</p>
            )}
            {items.map((n) => (
              <button
                key={n._id}
                type="button"
                onClick={() => !n.isRead && readOne.mutate(n._id)}
                className={`w-full text-left px-4 py-3 hover:bg-slate-50 ${
                  n.isRead ? '' : 'bg-indigo-50/50'
                }`}
              >
                <p className="text-sm font-medium text-slate-900 truncate">{n.title}</p>
                <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {new Date(n.createdAt).toLocaleString('en-GB')}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Header = ({ onMenuClick }) => {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-4 px-4 md:px-6 flex-shrink-0">
      <button
        type="button"
        onClick={onMenuClick}
        className="btn-icon text-slate-500 hover:bg-slate-100 lg:hidden"
        aria-label="Menu"
      >
        ☰
      </button>
      <h1 className="flex-1 text-base font-semibold text-slate-900 truncate">
        {titleFor(pathname)}
      </h1>
      <Bell />
      <Link to="/profile" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm flex items-center justify-center overflow-hidden">
          {user?.photo?.url ? (
            <img src={user.photo.url} alt="" className="w-full h-full object-cover" />
          ) : (
            `${user?.firstName?.[0] || ''}${user?.fatherName?.[0] || ''}`
          )}
        </div>
        <span className="hidden sm:block text-sm text-slate-700">{user?.firstName}</span>
      </Link>
    </header>
  );
};

export default Header;
