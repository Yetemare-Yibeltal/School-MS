import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';

const list = (v) => (Array.isArray(v) ? v : []);
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-GB') : '-');
const bookTitle = (x) =>
  x.bookTitle || (x.book && typeof x.book === 'object' ? x.book.title : '') || '-';
const memberName = (x) =>
  x.memberName ||
  (x.libraryMember && typeof x.libraryMember === 'object'
    ? x.libraryMember.memberName || x.libraryMember.name
    : '') ||
  '-';
const flat = (obj) =>
  Object.entries(obj && !Array.isArray(obj) ? obj : {}).filter(
    ([, v]) => typeof v !== 'object' || v === null
  );
const pretty = (k) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

const StatBlock = ({ title, stats, link }) => (
  <div className="card">
    <div className="card-header">
      <h3 className="text-sm font-semibold">{title}</h3>
      {link && (
        <Link to={link} className="text-xs text-indigo-600">
          View all
        </Link>
      )}
    </div>
    <div className="card-body grid grid-cols-2 gap-3">
      {flat(stats).length === 0 && <p className="text-sm text-slate-400 col-span-2">No data.</p>}
      {flat(stats).map(([k, v]) => (
        <div key={k} className="p-3 rounded-xl bg-slate-50 text-center">
          <p className="text-xl font-bold text-slate-900">{String(v)}</p>
          <p className="text-xs text-slate-500">{pretty(k)}</p>
        </div>
      ))}
    </div>
  </div>
);

const LibraryDashboardPage = () => {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['library-dashboard'],
    queryFn: async () => (await api.get('/library/dashboard')).data.data,
  });

  const fail = (err) => toast.error(err.response?.data?.message || 'Request failed.');
  const refresh = () => qc.invalidateQueries({ queryKey: ['library-dashboard'] });
  const check = useMutation({
    mutationFn: () => api.post('/library/overdue/check'),
    onSuccess: (r) => {
      toast.success(r.data.message);
      refresh();
    },
    onError: fail,
  });
  const notify = useMutation({
    mutationFn: () => api.post('/library/overdue/notify'),
    onSuccess: (r) => toast.success(r.data.message),
    onError: fail,
  });

  if (isLoading) {
    return <div className="card p-10 text-center text-slate-400">Loading dashboard...</div>;
  }

  const overdue = list(data?.overdueIssues);
  const recent = list(data?.recentIssues);
  const popular = list(data?.popularBooks);
  const categories = list(data?.categoryStats);
  const ready = list(data?.readyForCollection);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Library Dashboard</h1>
          <p className="page-subtitle">Books, members and borrowing</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/library/issues" className="btn-primary">
            Issue / return
          </Link>
          <button
            type="button"
            className="btn-outline"
            disabled={check.isPending}
            onClick={() => check.mutate()}
          >
            Check overdue
          </button>
          <button
            type="button"
            className="btn-outline"
            disabled={notify.isPending}
            onClick={() => notify.mutate()}
          >
            Notify overdue members
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <StatBlock title="Books" stats={data?.bookStats} link="/library/books" />
        <StatBlock title="Members" stats={data?.memberStats} link="/library/members" />
        <StatBlock title="Issues" stats={data?.issueStats} link="/library/issues" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-red-700">Overdue books</h3>
            <span className="badge badge-danger">{overdue.length}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {overdue.length === 0 && (
              <p className="p-6 text-center text-sm text-slate-400">No overdue books.</p>
            )}
            {overdue.slice(0, 6).map((i) => {
              const days = i.dueDate
                ? Math.max(Math.floor((Date.now() - new Date(i.dueDate)) / 86400000), 0)
                : 0;
              return (
                <div key={i._id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{bookTitle(i)}</p>
                    <p className="text-xs text-slate-400">{memberName(i)}</p>
                  </div>
                  <span className="badge badge-danger">{days}d late</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Recent issues</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {recent.length === 0 && (
              <p className="p-6 text-center text-sm text-slate-400">No recent issues.</p>
            )}
            {recent.slice(0, 6).map((i) => (
              <div key={i._id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{bookTitle(i)}</p>
                  <p className="text-xs text-slate-400">{memberName(i)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">{fmt(i.issueDate || i.createdAt)}</p>
                  <span className="text-xs capitalize text-slate-600">{i.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Most borrowed books</h3>
          </div>
          <div className="card-body space-y-3">
            {popular.length === 0 && <p className="text-sm text-slate-400">No data yet.</p>}
            {popular.slice(0, 6).map((b, idx) => (
              <div key={b._id || idx} className="flex items-center gap-3">
                <span className="w-6 text-lg font-black text-slate-200 text-center">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {b.title || bookTitle(b)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {Array.isArray(b.authors) ? b.authors.join(', ') : b.author || ''}
                  </p>
                </div>
                <b className="text-indigo-600 text-sm">
                  {b.issueCount ?? b.totalIssues ?? b.count ?? ''}
                </b>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Books by category</h3>
          </div>
          <div className="card-body space-y-2">
            {categories.length === 0 && <p className="text-sm text-slate-400">No categories.</p>}
            {categories.map((c, idx) => (
              <div key={c._id || idx} className="flex justify-between text-sm">
                <span>{c.name || c.categoryName || c._id || 'Uncategorised'}</span>
                <b>{c.count ?? c.totalBooks ?? c.total ?? 0}</b>
              </div>
            ))}
          </div>
        </div>
      </div>

      {ready.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Reserved books ready for collection</h3>
            <span className="badge badge-info">{ready.length}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {ready.map((r) => (
              <div key={r._id} className="px-5 py-3 text-sm flex justify-between">
                <span>{bookTitle(r)}</span>
                <span className="text-slate-500">{memberName(r)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryDashboardPage;
