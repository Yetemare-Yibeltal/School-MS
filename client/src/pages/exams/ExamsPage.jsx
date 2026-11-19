import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const STATUSES = ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'];
const nameOf = (v, alt) => (v && typeof v === 'object' ? v.name : alt) || '-';

const ExamsPage = () => {
  const [params, setParams] = useSearchParams();
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const page = parseInt(params.get('page') || '1', 10);
  const grade = params.get('grade') || '';
  const status = params.get('status') || '';
  const search = params.get('search') || '';

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.set('page', '1');
    setParams(next);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['exams', page, grade, status, search],
    queryFn: async () => {
      const q = new URLSearchParams({ page, limit: 20 });
      if (grade) q.set('grade', grade);
      if (status) q.set('status', status);
      if (search) q.set('search', search);
      return (await api.get(`/exams?${q}`)).data;
    },
    keepPreviousData: true,
  });
  const { data: dash } = useQuery({
    queryKey: ['exam-dashboard'],
    queryFn: async () => (await api.get('/exams/dashboard')).data.data,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['exams'] });
    qc.invalidateQueries({ queryKey: ['exam-dashboard'] });
  };
  const fail = (err) => toast.error(err.response?.data?.message || 'Request failed.');
  const setStatus = useMutation({
    mutationFn: ({ id, status: s }) => api.patch(`/exams/${id}/status`, { status: s }),
    onSuccess: () => {
      toast.success('Status updated.');
      refresh();
    },
    onError: fail,
  });
  const remove = useMutation({
    mutationFn: (id) => api.delete(`/exams/${id}`),
    onSuccess: () => {
      toast.success('Exam deleted.');
      refresh();
    },
    onError: fail,
  });

  const exams = data?.data?.exams || [];
  const pg = data?.pagination || {};
  const isAdmin = ['super_admin', 'admin'].includes(role);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Examinations</h1>
          <p className="page-subtitle">
            {pg.total ? `${pg.total} exams` : 'Schedule and manage exams'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/report-cards" className="btn-outline">
            Report cards
          </Link>
          <Link to="/exams/new" className="btn-primary">
            Schedule exam
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['Total', dash?.totalExams],
          ['Scheduled', dash?.scheduled],
          ['Ongoing', dash?.ongoing],
          ['Completed', dash?.completed],
        ].map(([l, v]) => (
          <div key={l} className="card p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{v ?? 0}</p>
            <p className="text-xs text-slate-500">{l}</p>
          </div>
        ))}
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <input
          type="search"
          className="form-input flex-1 min-w-[200px]"
          placeholder="Search exams..."
          value={search}
          onChange={(e) => setParam('search', e.target.value)}
        />
        <select
          className="form-select w-36"
          value={grade}
          onChange={(e) => setParam('grade', e.target.value)}
        >
          <option value="">All grades</option>
          {GRADES.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
        <select
          className="form-select w-40"
          value={status}
          onChange={(e) => setParam('status', e.target.value)}
        >
          <option value="">All status</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Exam</th>
                <th>Subject</th>
                <th>Grade</th>
                <th>Date</th>
                <th>Marks</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              )}
              {!isLoading && exams.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No exams found
                  </td>
                </tr>
              )}
              {exams.map((e) => (
                <tr key={e._id}>
                  <td className="font-medium text-slate-900">{e.title}</td>
                  <td>{nameOf(e.subject, e.subjectName)}</td>
                  <td>{e.grade}</td>
                  <td>{e.startDate ? new Date(e.startDate).toLocaleDateString('en-GB') : '-'}</td>
                  <td>
                    {e.totalMarks} (pass {e.passingMarks})
                  </td>
                  <td className="capitalize">{e.status}</td>
                  <td className="text-right space-x-2">
                    <Link to={`/exams/${e._id}`} className="btn-outline btn-sm">
                      View
                    </Link>
                    <Link to={`/exams/${e._id}/results`} className="btn-outline btn-sm">
                      Results
                    </Link>
                    {e.status === 'scheduled' && (
                      <button
                        type="button"
                        className="btn-outline btn-sm"
                        onClick={() => setStatus.mutate({ id: e._id, status: 'ongoing' })}
                      >
                        Start
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        className="btn-danger btn-sm"
                        onClick={() =>
                          window.confirm(`Delete "${e.title}"?`) && remove.mutate(e._id)
                        }
                      >
                        Delete
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
              Page {page} of {pg.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-outline btn-sm"
                disabled={page <= 1}
                onClick={() => setParam('page', String(page - 1))}
              >
                Prev
              </button>
              <button
                type="button"
                className="btn-outline btn-sm"
                disabled={page >= pg.totalPages}
                onClick={() => setParam('page', String(page + 1))}
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

export default ExamsPage;
