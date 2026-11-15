import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const STATUSES = ['active', 'inactive', 'on_leave', 'terminated', 'resigned'];

const EmployeesPage = () => {
  const [params, setParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const page = parseInt(params.get('page') || '1', 10);
  const search = params.get('search') || '';
  const status = params.get('status') || 'active';
  const department = params.get('department') || '';

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
    queryKey: ['employees', page, search, status, department],
    queryFn: async () => {
      const q = new URLSearchParams({ page, limit: 20 });
      if (search) q.set('search', search);
      if (status) q.set('status', status);
      if (department) q.set('department', department);
      return (await api.get(`/employees?${q}`)).data;
    },
    keepPreviousData: true,
  });

  const { data: stats } = useQuery({
    queryKey: ['employees-stats'],
    queryFn: async () => (await api.get('/employees/stats')).data.data,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => (await api.get('/hrm/departments')).data.data.departments || [],
  });

  const deactivate = useMutation({
    mutationFn: (id) => api.delete(`/employees/${id}`),
    onSuccess: () => {
      toast.success('Employee deactivated.');
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['employees-stats'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not deactivate.'),
  });

  const employees = data?.data?.employees || [];
  const pg = data?.pagination || {};
  const canManage = ['super_admin', 'admin', 'hr_manager'].includes(user?.role);
  const canDelete = ['super_admin', 'admin'].includes(user?.role);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">
            {pg.total ? `${pg.total} employees` : 'Manage non-teaching staff'}
          </p>
        </div>
        {canManage && (
          <Link to="/employees/new" className="btn-primary">
            Add Employee
          </Link>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            ['Total', stats.total],
            ['Active', stats.active],
            ['Inactive', stats.inactive],
          ].map(([label, value]) => (
            <div key={label} className="card p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{value ?? 0}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card p-4 flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setParam('search', e.target.value)}
          placeholder="Search by name or ID..."
          className="form-input flex-1 min-w-[200px]"
        />
        <select
          value={department}
          onChange={(e) => setParam('department', e.target.value)}
          className="form-select w-48"
        >
          <option value="">All departments</option>
          {(departments || []).map((d) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setParam('status', e.target.value)}
          className="form-select w-40"
        >
          <option value="">All status</option>
          {STATUSES.map((s) => (
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
                <th>Employee</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Employment</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              )}
              {!isLoading && employees.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No employees found
                  </td>
                </tr>
              )}
              {employees.map((e) => (
                <tr key={e._id} className="hover:bg-slate-50">
                  <td>
                    <p className="text-sm font-medium text-slate-900">
                      {e.firstName} {e.fatherName}
                    </p>
                    <p className="text-xs text-slate-500">{e.employeeId}</p>
                  </td>
                  <td>
                    <span className="badge badge-primary">{e.departmentName || '-'}</span>
                  </td>
                  <td className="text-sm">{e.designationName || '-'}</td>
                  <td className="text-sm">{e.employmentType}</td>
                  <td>
                    <span
                      className={`badge capitalize ${
                        e.status === 'active' ? 'badge-success' : 'badge-gray'
                      }`}
                    >
                      {e.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="text-right space-x-2">
                    <Link to={`/employees/${e._id}`} className="btn-outline btn-sm">
                      View
                    </Link>
                    {canManage && (
                      <Link to={`/employees/${e._id}/edit`} className="btn-outline btn-sm">
                        Edit
                      </Link>
                    )}
                    {canDelete && e.status === 'active' && (
                      <button
                        type="button"
                        className="btn-danger btn-sm"
                        onClick={() => {
                          if (window.confirm(`Deactivate ${e.firstName} ${e.fatherName}?`)) {
                            deactivate.mutate(e._id);
                          }
                        }}
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pg.totalPages > 1 && (
          <div className="px-5 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {page} of {pg.totalPages} ({pg.total} employees)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!pg.hasPreviousPage}
                onClick={() => setParam('page', String(page - 1))}
                className="btn-outline btn-sm"
              >
                Prev
              </button>
              <button
                type="button"
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

export default EmployeesPage;
