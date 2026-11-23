import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/common/Modal';

const TYPES = ['student', 'teacher', 'employee'];
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-GB') : '-');
const person = (m) => {
  const p = m.student || m.teacher || m.employee;
  return (
    m.memberName ||
    m.name ||
    (p && typeof p === 'object' ? `${p.firstName || ''} ${p.fatherName || ''}`.trim() : '') ||
    '-'
  );
};

const LibraryMembersPage = () => {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const page = parseInt(params.get('page') || '1', 10);
  const search = params.get('search') || '';
  const memberType = params.get('memberType') || '';
  const status = params.get('status') || '';

  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    memberType: 'student',
    person: '',
    maxBooksAllowed: '3',
    maxLoanDays: '14',
    notes: '',
  });
  const [suspend, setSuspend] = useState(null);
  const [reason, setReason] = useState('');
  const [until, setUntil] = useState('');

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.set('page', '1');
    setParams(next);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['library-members', page, search, memberType, status],
    queryFn: async () => {
      const q = new URLSearchParams({ page, limit: 20 });
      if (search) q.set('search', search);
      if (memberType) q.set('memberType', memberType);
      if (status) q.set('status', status);
      return (await api.get(`/library/members?${q}`)).data;
    },
    keepPreviousData: true,
  });
  const members = data?.data?.members || [];
  const pg = data?.pagination || {};

  const { data: people = [] } = useQuery({
    queryKey: ['member-people', f.memberType],
    queryFn: async () => {
      const path = `${f.memberType}s`;
      return (await api.get(`/${path}?status=active&limit=200`)).data.data[path] || [];
    },
    enabled: open,
  });

  const fail = (err) => toast.error(err.response?.data?.message || 'Request failed.');
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['library-members'] });
    qc.invalidateQueries({ queryKey: ['library-dashboard'] });
  };

  const register = useMutation({
    mutationFn: (p) => api.post('/library/members', p),
    onSuccess: () => {
      toast.success('Library member registered.');
      refresh();
      setOpen(false);
    },
    onError: fail,
  });
  const doSuspend = useMutation({
    mutationFn: ({ id, body }) => api.post(`/library/members/${id}/suspend`, body),
    onSuccess: () => {
      toast.success('Member suspended.');
      refresh();
      setSuspend(null);
    },
    onError: fail,
  });
  const reactivate = useMutation({
    mutationFn: (id) => api.post(`/library/members/${id}/reactivate`),
    onSuccess: () => {
      toast.success('Member reactivated.');
      refresh();
    },
    onError: fail,
  });

  const submit = (e) => {
    e.preventDefault();
    if (!f.person) {
      toast.error(`Select a ${f.memberType}.`);
      return;
    }
    register.mutate({
      memberType: f.memberType,
      [f.memberType]: f.person,
      maxBooksAllowed: parseInt(f.maxBooksAllowed, 10) || 3,
      maxLoanDays: parseInt(f.maxLoanDays, 10) || 14,
      notes: f.notes || undefined,
    });
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Library Members</h1>
          <p className="page-subtitle">
            {pg.total ? `${pg.total} members` : 'Registered borrowers'}
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setF({
              memberType: 'student',
              person: '',
              maxBooksAllowed: '3',
              maxLoanDays: '14',
              notes: '',
            });
            setOpen(true);
          }}
        >
          Register Member
        </button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <input
          type="search"
          className="form-input flex-1 min-w-[200px]"
          placeholder="Search name or membership ID..."
          value={search}
          onChange={(e) => setParam('search', e.target.value)}
        />
        <select
          className="form-select w-36"
          value={memberType}
          onChange={(e) => setParam('memberType', e.target.value)}
        >
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          className="form-select w-36"
          value={status}
          onChange={(e) => setParam('status', e.target.value)}
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Membership ID</th>
                <th>Type</th>
                <th>Borrowed</th>
                <th>Limit</th>
                <th>Loan days</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              )}
              {!isLoading && members.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No library members found
                  </td>
                </tr>
              )}
              {members.map((m) => (
                <tr key={m._id}>
                  <td className="font-medium text-slate-900">{person(m)}</td>
                  <td>
                    <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">
                      {m.membershipId}
                    </span>
                  </td>
                  <td className="capitalize">{m.memberType}</td>
                  <td>{m.currentBorrowedBooks ?? m.activeIssues ?? 0}</td>
                  <td>{m.maxBooksAllowed}</td>
                  <td>{m.maxLoanDays ?? '-'}</td>
                  <td>
                    <span
                      className={`badge capitalize ${
                        m.status === 'active'
                          ? 'badge-success'
                          : m.status === 'suspended'
                          ? 'badge-danger'
                          : 'badge-gray'
                      }`}
                    >
                      {m.status}
                    </span>
                    {m.suspendedUntil && (
                      <span className="block text-[10px] text-slate-400">
                        until {fmt(m.suspendedUntil)}
                      </span>
                    )}
                  </td>
                  <td className="text-right">
                    {m.status === 'active' && (
                      <button
                        type="button"
                        className="btn-danger btn-sm"
                        onClick={() => {
                          setReason('');
                          setUntil('');
                          setSuspend(m);
                        }}
                      >
                        Suspend
                      </button>
                    )}
                    {m.status === 'suspended' && (
                      <button
                        type="button"
                        className="btn-success btn-sm"
                        onClick={() => reactivate.mutate(m._id)}
                      >
                        Reactivate
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
              Page {page} of {pg.totalPages} ({pg.total} members)
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

      <Modal open={open} title="Register library member" onClose={() => setOpen(false)}>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Member type</label>
            <div className="flex gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setF((p) => ({ ...p, memberType: t, person: '' }))}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm border capitalize ${
                    f.memberType === t
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white border-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Select {f.memberType}</label>
            <select
              className="form-select"
              value={f.person}
              onChange={(e) => setF((p) => ({ ...p, person: e.target.value }))}
            >
              <option value="">Select</option>
              {people.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.firstName} {p.fatherName} ({p.studentId || p.teacherId || p.employeeId})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Max books</label>
              <input
                type="number"
                min="1"
                max="20"
                className="form-input"
                value={f.maxBooksAllowed}
                onChange={(e) => setF((p) => ({ ...p, maxBooksAllowed: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Loan days</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={f.maxLoanDays}
                onChange={(e) => setF((p) => ({ ...p, maxLoanDays: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              value={f.notes}
              onChange={(e) => setF((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>
          <button type="submit" disabled={register.isPending} className="btn-primary w-full">
            {register.isPending ? 'Saving...' : 'Register member'}
          </button>
        </form>
      </Modal>

      <Modal open={!!suspend} title="Suspend member" onClose={() => setSuspend(null)}>
        <div className="form-group">
          <label className="form-label">Reason (required)</label>
          <textarea
            className="form-textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Suspended until (optional)</label>
          <input
            type="date"
            className="form-input"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn-danger w-full"
          disabled={doSuspend.isPending}
          onClick={() =>
            reason.trim()
              ? doSuspend.mutate({
                  id: suspend._id,
                  body: { reason: reason.trim(), suspendedUntil: until || undefined },
                })
              : toast.error('A reason is required.')
          }
        >
          {doSuspend.isPending ? 'Saving...' : 'Suspend member'}
        </button>
      </Modal>
    </div>
  );
};

export default LibraryMembersPage;
