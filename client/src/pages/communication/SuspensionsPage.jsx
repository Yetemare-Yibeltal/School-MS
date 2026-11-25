import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { useAuthStore } from '../../store/authStore';

const OFFENSES = ['Fighting', 'Bullying', 'Cheating', 'Vandalism', 'Truancy', 'Disrespect', 'Drugs', 'Theft', 'Harassment', 'Other'];
const TYPES = ['In-School', 'Out-of-School', 'Expulsion'];
const today = () => new Date().toISOString().split('T')[0];
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-GB') : '-');
const studentOf = (s) =>
  s.studentName || (s.student && typeof s.student === 'object' ? `${s.student.firstName || ''} ${s.student.fatherName || ''}`.trim() : '-');
const statusClass = (s) => (s === 'active' ? 'badge-danger' : s === 'reinstated' ? 'badge-success' : s === 'pending_approval' ? 'badge-warning' : 'badge-gray');

const empty = () => ({
  student: '',
  type: 'Out-of-School',
  offenseCategory: 'Fighting',
  reason: '',
  incidentDescription: '',
  incidentDate: today(),
  startDate: today(),
  endDate: today(),
  reinstatementConditions: '',
  requiresParentMeeting: true,
});

const SuspensionsPage = () => {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const canWrite = ['super_admin', 'admin', 'teacher'].includes(role);
  const isAdmin = ['super_admin', 'admin'].includes(role);
  const [params, setParams] = useSearchParams();
  const page = parseInt(params.get('page') || '1', 10);
  const search = params.get('search') || '';
  const status = params.get('status') || '';

  const [open, setOpen] = useState(false);
  const [f, setF] = useState(empty());
  const [errors, setErrors] = useState({});
  const [back, setBack] = useState(null);
  const [notes, setNotes] = useState('');
  const [conditionsMet, setConditionsMet] = useState(true);
  const [sq, setSq] = useState('');

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.set('page', '1');
    setParams(next);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['suspensions', page, search, status],
    queryFn: async () => {
      const q = new URLSearchParams({ page, limit: 15 });
      if (search) q.set('search', search);
      if (status) q.set('status', status);
      return (await api.get(`/communications/suspensions?${q}`)).data;
    },
    keepPreviousData: true,
  });
  const items = data?.data?.suspensions || [];
  const pg = data?.pagination || {};

  const { data: students = [] } = useQuery({
    queryKey: ['susp-students', sq],
    queryFn: async () => (await api.get(`/students?status=active&search=${encodeURIComponent(sq)}&limit=8`)).data.data.students,
    enabled: open && sq.length >= 2 && !f.student,
  });

  const fail = (err) => toast.error(err.response?.data?.message || 'Request failed.');
  const refresh = () => qc.invalidateQueries({ queryKey: ['suspensions'] });

  const create = useMutation({
    mutationFn: (p) => api.post('/communications/suspensions', p),
    onSuccess: (res) => {
      toast.success(res.data.message);
      refresh();
      setOpen(false);
    },
    onError: fail,
  });
  const approve = useMutation({
    mutationFn: (id) => api.post(`/communications/suspensions/${id}/approve`, {}),
    onSuccess: () => {
      toast.success('Suspension approved.');
      refresh();
    },
    onError: fail,
  });
  const reinstate = useMutation({
    mutationFn: ({ id, body }) => api.post(`/communications/suspensions/${id}/reinstate`, body),
    onSuccess: () => {
      toast.success('Student reinstated.');
      refresh();
      setBack(null);
    },
    onError: fail,
  });

  const set = (k) => (e) => {
    setF((p) => ({ ...p, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: null }));
  };
  const cls = (k) => (errors[k] ? 'form-input-error' : 'form-input');
  const err = (k) => (errors[k] ? <p className="form-error">{errors[k]}</p> : null);

  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (!f.student) er.student = 'Choose a student';
    if (!f.reason.trim()) er.reason = 'Required';
    if (!f.incidentDescription.trim()) er.incidentDescription = 'Required';
    if (f.endDate < f.startDate) er.endDate = 'End must be after start';
    setErrors(er);
    if (Object.keys(er).length) {
      return;
    }
    create.mutate({
      student: f.student,
      type: f.type,
      reason: f.reason.trim(),
      offenseCategory: f.offenseCategory,
      incidentDescription: f.incidentDescription.trim(),
      incidentDate: f.incidentDate,
      startDate: f.startDate,
      endDate: f.endDate,
      reinstatementConditions: f.reinstatementConditions.trim() || undefined,
      requiresParentMeeting: f.requiresParentMeeting,
    });
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Suspensions</h1>
          <p className="page-subtitle">{pg.total ? `${pg.total} records` : 'Student discipline records'}</p>
        </div>
        {canWrite && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setF(empty());
              setErrors({});
              setSq('');
              setOpen(true);
            }}
          >
            Record suspension
          </button>
        )}
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <input type="search" className="form-input flex-1 min-w-[200px]" placeholder="Search..." value={search} onChange={(e) => setParam('search', e.target.value)} />
        <select className="form-select w-44" value={status} onChange={(e) => setParam('status', e.target.value)}>
          <option value="">All status</option>
          {['pending_approval', 'active', 'completed', 'reinstated', 'cancelled'].map((s) => (
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
                <th>Student</th>
                <th>Type</th>
                <th>Offense</th>
                <th>From</th>
                <th>To</th>
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
              {!isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No suspension records
                  </td>
                </tr>
              )}
              {items.map((s) => (
                <tr key={s._id}>
                  <td className="font-medium text-slate-900">{studentOf(s)}</td>
                  <td>{s.type}</td>
                  <td>
                    {s.offenseCategory}
                    <p className="text-xs text-slate-400 truncate max-w-[180px]">{s.reason}</p>
                  </td>
                  <td>{fmt(s.startDate)}</td>
                  <td>{fmt(s.endDate)}</td>
                  <td>
                    <span className={`badge capitalize ${statusClass(s.status)}`}>{(s.status || '').replace('_', ' ')}</span>
                  </td>
                  <td className="text-right space-x-2 whitespace-nowrap">
                    {isAdmin && s.status === 'pending_approval' && (
                      <button type="button" className="btn-success btn-sm" onClick={() => approve.mutate(s._id)}>
                        Approve
                      </button>
                    )}
                    {canWrite && s.status === 'active' && (
                      <button
                        type="button"
                        className="btn-outline btn-sm"
                        onClick={() => {
                          setNotes('');
                          setConditionsMet(true);
                          setBack(s);
                        }}
                      >
                        Reinstate
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
              <button type="button" className="btn-outline btn-sm" disabled={page <= 1} onClick={() => setParam('page', String(page - 1))}>
                Prev
              </button>
              <button type="button" className="btn-outline btn-sm" disabled={page >= pg.totalPages} onClick={() => setParam('page', String(page + 1))}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal open={open} title="Record suspension" onClose={() => setOpen(false)}>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Student</label>
            {f.student ? (
              <div className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg text-sm">
                <span>{sq}</span>
                <button type="button" className="text-xs text-indigo-600" onClick={() => { setF((p) => ({ ...p, student: '' })); setSq(''); }}>
                  Change
                </button>
              </div>
            ) : (
              <>
                <input className={cls('student')} placeholder="Search student by name or ID..." value={sq} onChange={(e) => setSq(e.target.value)} />
                {students.length > 0 && (
                  <div className="border rounded-xl mt-1 max-h-40 overflow-y-auto">
                    {students.map((s) => (
                      <button
                        key={s._id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50"
                        onClick={() => {
                          setF((p) => ({ ...p, student: s._id }));
                          setSq(`${s.firstName} ${s.fatherName} (${s.studentId})`);
                          setErrors((p) => ({ ...p, student: null }));
                        }}
                      >
                        {s.firstName} {s.fatherName} <span className="text-xs text-slate-400">{s.studentId} · {s.grade}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            {err('student')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Type</label>
              <input className="form-input" list="susp-types" value={f.type} onChange={set('type')} />
              <datalist id="susp-types">
                {TYPES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label className="form-label">Offense</label>
              <input className="form-input" list="susp-offenses" value={f.offenseCategory} onChange={set('offenseCategory')} />
              <datalist id="susp-offenses">
                {OFFENSES.map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label className="form-label">Incident date</label>
              <input type="date" max={today()} className="form-input" value={f.incidentDate} onChange={set('incidentDate')} />
            </div>
            <div className="form-group">
              <label className="form-label">Start date</label>
              <input type="date" className="form-input" value={f.startDate} onChange={set('startDate')} />
            </div>
            <div className="form-group col-span-2">
              <label className="form-label">End date</label>
              <input type="date" min={f.startDate} className={cls('endDate')} value={f.endDate} onChange={set('endDate')} />
              {err('endDate')}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Reason</label>
            <input className={cls('reason')} value={f.reason} onChange={set('reason')} />
            {err('reason')}
          </div>
          <div className="form-group">
            <label className="form-label">Incident description</label>
            <textarea className={errors.incidentDescription ? 'form-input-error' : 'form-textarea'} value={f.incidentDescription} onChange={set('incidentDescription')} />
            {err('incidentDescription')}
          </div>
          <div className="form-group">
            <label className="form-label">Conditions for return</label>
            <textarea className="form-textarea" value={f.reinstatementConditions} onChange={set('reinstatementConditions')} />
          </div>
          <label className="flex items-center gap-2 mb-4 text-sm">
            <input type="checkbox" className="form-checkbox" checked={f.requiresParentMeeting} onChange={(e) => setF((p) => ({ ...p, requiresParentMeeting: e.target.checked }))} />
            Parent meeting required
          </label>
          <p className="text-xs text-slate-500 mb-3">Suspensions longer than 3 days need director approval before they become active.</p>
          <button type="submit" disabled={create.isPending} className="btn-danger w-full">
            {create.isPending ? 'Saving...' : 'Record suspension'}
          </button>
        </form>
      </Modal>

      <Modal open={!!back} title="Reinstate student" onClose={() => setBack(null)}>
        {back && (
          <div>
            <p className="text-sm text-slate-600 mb-3">{studentOf(back)}</p>
            <label className="flex items-center gap-2 mb-3 text-sm">
              <input type="checkbox" className="form-checkbox" checked={conditionsMet} onChange={(e) => setConditionsMet(e.target.checked)} />
              Return conditions have been met
            </label>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <button
              type="button"
              className="btn-success w-full"
              disabled={reinstate.isPending}
              onClick={() => reinstate.mutate({ id: back._id, body: { notes: notes || undefined, conditionsMet } })}
            >
              {reinstate.isPending ? 'Saving...' : 'Reinstate'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SuspensionsPage;