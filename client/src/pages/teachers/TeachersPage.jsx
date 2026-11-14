import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';

import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const TeachersPage = () => {
  const [params, setParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const page = parseInt(params.get('page') || '1');
  const search = params.get('search') || '';
  const status = params.get('status') || 'active';

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    if (key !== 'page') {
      next.set('page', '1');
    }
    setParams(next);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['teachers', page, search, status],
    queryFn: async () => {
      const q = new URLSearchParams({ page, limit: 20 });
      if (search) {
        q.set('search', search);
      }
      if (status) {
        q.set('status', status);
      }
      return (await api.get(`/teachers?${q}`)).data;
    },
    keepPreviousData: true,
  });

  const teachers = data?.data?.teachers || [];
  const pg = data?.pagination || {};
  const canManage = ['super_admin', 'admin', 'hr_manager'].includes(user?.role);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Teachers</h1>
          <p className="page-subtitle">
            {pg.total ? `${pg.total} teachers` : 'Manage teaching staff'}
          </p>
        </div>
        {canManage && (
          <Link to="/teachers/new" className="btn-primary">
            Add Teacher
          </Link>
        )}
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setParam('search', e.target.value)}
          placeholder="Search by name, ID or subject..."
          className="form-input flex-1 min-w-[200px]"
        />
        <select
          value={status}
          onChange={(e) => setParam('status', e.target.value)}
          className="form-select w-40"
        >
          <option value="">All status</option>
          {['active', 'inactive', 'on_leave', 'terminated', 'resigned'].map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Subject</th>
                <th>Qualification</th>
                <th>Employment</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No teachers found
                  </td>
                </tr>
              ) : (
                teachers.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50">
                    <td>
                      <p className="text-sm font-medium text-slate-900">
                        {t.firstName} {t.fatherName}
                      </p>
                      <p className="text-xs text-slate-500">{t.teacherId}</p>
                    </td>
                    <td>
                      <span className="badge badge-primary">{t.primarySubject}</span>
                    </td>
                    <td className="text-sm">{t.qualification}</td>
                    <td className="text-sm">{t.employmentType}</td>
                    <td>
                      <span
                        className={`badge capitalize ${
                          t.status === 'active' ? 'badge-success' : 'badge-gray'
                        }`}
                      >
                        {t.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-right">
                      <Link to={`/teachers/${t._id}`} className="btn-outline btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pg.totalPages > 1 && (
          <div className="px-5 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {page} of {pg.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={!pg.hasPreviousPage}
                onClick={() => setParam('page', String(page - 1))}
                className="btn-outline btn-sm"
              >
                Prev
              </button>
              <button
                disabled={!pg.hasNextPage}
                onClick={() => setParam('page', String(page + 1))}
                className="btn-outline btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeachersPage;
