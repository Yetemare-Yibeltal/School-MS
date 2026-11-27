import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const today = () => new Date().toISOString().split('T')[0];
const who = (l) =>
  l.user && typeof l.user === 'object'
    ? `${l.user.firstName || ''} ${l.user.fatherName || ''}`.trim()
    : l.userName || '-';
const tone = (a = '') =>
  /DELETE|DEACTIVATE|REJECT/.test(a)
    ? 'badge-danger'
    : /CREATE|APPROVE/.test(a)
    ? 'badge-success'
    : /UPDATE|PUBLISH/.test(a)
    ? 'badge-info'
    : 'badge-gray';

const AuditLogsPage = () => {
  const [params, setParams] = useSearchParams();
  const page = parseInt(params.get('page') || '1', 10);
  const action = params.get('action') || '';
  const resource = params.get('resource') || '';
  const startDate = params.get('startDate') || '';
  const endDate = params.get('endDate') || '';

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.set('page', '1');
    setParams(next);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, action, resource, startDate, endDate],
    queryFn: async () => {
      const q = new URLSearchParams({ page, limit: 25 });
      if (action) q.set('action', action);
      if (resource) q.set('resource', resource);
      if (startDate) q.set('startDate', startDate);
      if (endDate) q.set('endDate', endDate);
      return (await api.get(`/system/audit-logs?${q}`)).data;
    },
    keepPreviousData: true,
  });
  const logs = data?.data?.logs || [];
  const pg = data?.pagination || {};

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">
            {pg.total ? `${pg.total.toLocaleString()} entries` : 'System activity history'}
          </p>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <input
          className="form-input w-44"
          placeholder="Action (e.g. CREATE)"
          value={action}
          onChange={(e) => setParam('action', e.target.value.toUpperCase())}
        />
        <input
          className="form-input w-44"
          placeholder="Resource (e.g. student)"
          value={resource}
          onChange={(e) => setParam('resource', e.target.value)}
        />
        <input
          type="date"
          max={today()}
          className="form-input w-40"
          value={startDate}
          onChange={(e) => setParam('startDate', e.target.value)}
        />
        <input
          type="date"
          max={today()}
          min={startDate}
          className="form-input w-40"
          value={endDate}
          onChange={(e) => setParam('endDate', e.target.value)}
        />
        {(action || resource || startDate || endDate) && (
          <button type="button" className="btn-ghost" onClick={() => setParams({ page: '1' })}>
            Clear
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="table-container rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Description</th>
                <th>IP</th>
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
              {!isLoading && logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No log entries
                  </td>
                </tr>
              )}
              {logs.map((l) => (
                <tr key={l._id}>
                  <td className="text-xs whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString('en-GB')}
                  </td>
                  <td>{who(l)}</td>
                  <td>
                    <span className={`badge ${tone(l.action)}`}>{l.action}</span>
                  </td>
                  <td className="capitalize">{(l.resource || '').replace('_', ' ')}</td>
                  <td className="max-w-[280px] truncate text-sm text-slate-600">{l.description}</td>
                  <td className="text-xs font-mono text-slate-400">{l.ipAddress || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pg.totalPages > 1 && (
          <div className="px-5 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {pg.from}-{pg.to} of {pg.total}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-outline btn-sm"
                disabled={!pg.hasPreviousPage}
                onClick={() => setParam('page', String(page - 1))}
              >
                Prev
              </button>
              <button
                type="button"
                className="btn-outline btn-sm"
                disabled={!pg.hasNextPage}
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

export default AuditLogsPage;
