import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/common/Modal';

const today = () => new Date().toISOString().split('T')[0];
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-GB') : '-');
const staffName = (a) => {
  const p = a.teacher || a.employee;
  return p && typeof p === 'object'
    ? `${p.firstName || ''} ${p.fatherName || ''}`.trim()
    : a.staffName || '-';
};
const days = (s, e) => Math.floor((new Date(e) - new Date(s)) / 86400000) + 1;

const LeavesPage = () => {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [apply, setApply] = useState(false);
  const [review, setReview] = useState({ open: false, item: null, action: '' });
  const [text, setText] = useState('');
  const [f, setF] = useState({
    staffType: 'teacher',
    staff: '',
    leaveType: '',
    startDate: today(),
    endDate: today(),
    reason: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['leaves', status],
    queryFn: async () =>
      (await api.get(`/hrm/leaves?limit=50${status ? `&status=${status}` : ''}`)).data.data
        .applications,
  });
  const apps = data || [];

  const { data: types = [] } = useQuery({
    queryKey: ['leave-types'],
    queryFn: async () => (await api.get('/hrm/leave-types')).data.data.leaveTypes,
  });
  const { data: staff = [] } = useQuery({
    queryKey: ['staff-list', f.staffType],
    queryFn: async () => {
      const path = f.staffType === 'teacher' ? 'teachers' : 'employees';
      const res = await api.get(`/${path}?status=active&limit=100`);
      return res.data.data[path] || [];
    },
    enabled: apply,
  });

  const fail = (err) => toast.error(err.response?.data?.message || 'Request failed.');
  const refresh = () => qc.invalidateQueries({ queryKey: ['leaves'] });

  const submitApp = useMutation({
    mutationFn: (p) => api.post('/hrm/leaves', p),
    onSuccess: () => {
      toast.success('Leave application submitted.');
      refresh();
      setApply(false);
    },
    onError: fail,
  });
  const decide = useMutation({
    mutationFn: ({ id, action, body }) => api.post(`/hrm/leaves/${id}/${action}`, body),
    onSuccess: (_, v) => {
      toast.success(v.action === 'approve' ? 'Approved.' : 'Rejected.');
      refresh();
      setReview({ open: false, item: null, action: '' });
      setText('');
    },
    onError: fail,
  });

  const submit = (e) => {
    e.preventDefault();
    if (!f.staff || !f.leaveType || !f.reason.trim()) {
      toast.error('Staff member, leave type and reason are required.');
      return;
    }
    if (f.endDate < f.startDate) {
      toast.error('End date must be after start date.');
      return;
    }
    submitApp.mutate({
      staffType: f.staffType,
      [f.staffType]: f.staff,
      leaveType: f.leaveType,
      startDate: f.startDate,
      endDate: f.endDate,
      numberOfDays: days(f.startDate, f.endDate),
      reason: f.reason.trim(),
    });
  };

  const confirm = () => {
    const { item, action } = review;
    if (action === 'reject' && !text.trim()) {
      toast.error('A rejection reason is required.');
      return;
    }
    decide.mutate({
      id: item._id,
      action,
      body: action === 'reject' ? { reason: text } : { remarks: text || undefined },
    });
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">{apps.length} applications</p>
        </div>
        <div className="flex gap-2">
          <select
            className="form-select w-40"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All status</option>
            {['pending', 'approved', 'rejected', 'cancelled'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button type="button" className="btn-primary" onClick={() => setApply(true)}>
            Apply Leave
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
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
              {!isLoading && apps.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No applications
                  </td>
                </tr>
              )}
              {apps.map((a) => (
                <tr key={a._id}>
                  <td>{staffName(a)}</td>
                  <td>{a.leaveType?.name || a.leaveTypeName || '-'}</td>
                  <td>{fmt(a.startDate)}</td>
                  <td>{fmt(a.endDate)}</td>
                  <td>{a.numberOfDays}</td>
                  <td className="capitalize">{a.status}</td>
                  <td className="text-right space-x-2">
                    {a.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          className="btn-success btn-sm"
                          onClick={() => setReview({ open: true, item: a, action: 'approve' })}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn-danger btn-sm"
                          onClick={() => setReview({ open: true, item: a, action: 'reject' })}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={apply} title="Apply for Leave" onClose={() => setApply(false)}>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Staff type</label>
            <select
              className="form-select"
              value={f.staffType}
              onChange={(e) => setF((p) => ({ ...p, staffType: e.target.value, staff: '' }))}
            >
              <option value="teacher">Teacher</option>
              <option value="employee">Employee</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Staff member</label>
            <select
              className="form-select"
              value={f.staff}
              onChange={(e) => setF((p) => ({ ...p, staff: e.target.value }))}
            >
              <option value="">Select</option>
              {staff.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.firstName} {s.fatherName}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Leave type</label>
            <select
              className="form-select"
              value={f.leaveType}
              onChange={(e) => setF((p) => ({ ...p, leaveType: e.target.value }))}
            >
              <option value="">Select</option>
              {types.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">From</label>
              <input
                type="date"
                className="form-input"
                value={f.startDate}
                onChange={(e) => setF((p) => ({ ...p, startDate: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">To</label>
              <input
                type="date"
                className="form-input"
                value={f.endDate}
                onChange={(e) => setF((p) => ({ ...p, endDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea
              className="form-textarea"
              value={f.reason}
              onChange={(e) => setF((p) => ({ ...p, reason: e.target.value }))}
            />
          </div>
          <button type="submit" disabled={submitApp.isPending} className="btn-primary w-full">
            {submitApp.isPending ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </Modal>

      <Modal
        open={review.open}
        title={review.action === 'approve' ? 'Approve leave' : 'Reject leave'}
        onClose={() => setReview({ open: false, item: null, action: '' })}
      >
        <div className="form-group">
          <label className="form-label">
            {review.action === 'reject' ? 'Reason (required)' : 'Remarks (optional)'}
          </label>
          <textarea
            className="form-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <button
          type="button"
          disabled={decide.isPending}
          className="btn-primary w-full"
          onClick={confirm}
        >
          {decide.isPending ? 'Saving...' : 'Confirm'}
        </button>
      </Modal>
    </div>
  );
};

export default LeavesPage;
