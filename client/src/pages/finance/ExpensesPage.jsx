import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { useAuthStore } from '../../store/authStore';

const STATUSES = ['pending', 'approved', 'paid', 'rejected', 'cancelled'];
const METHODS = ['Cash', 'Bank Transfer', 'Telebirr', 'CBE Birr', 'Cheque', 'Other'];
const money = (n) => `ETB ${Number(n || 0).toLocaleString()}`;
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-GB') : '-');
const today = () => new Date().toISOString().split('T')[0];
const catName = (e) =>
  e.categoryName || (e.category && typeof e.category === 'object' ? e.category.name : '') || '-';
const badge = (s) =>
  s === 'paid'
    ? 'badge-success'
    : s === 'approved'
    ? 'badge-info'
    : s === 'pending'
    ? 'badge-warning'
    : s === 'rejected'
    ? 'badge-danger'
    : 'badge-gray';

const emptyForm = () => ({
  title: '',
  category: '',
  amount: '',
  taxAmount: '0',
  date: today(),
  vendor: '',
  invoiceNumber: '',
  description: '',
});

const ExpensesPage = () => {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const canApprove = ['super_admin', 'admin', 'accountant'].includes(role);
  const canCancel = ['super_admin', 'admin'].includes(role);
  const [params, setParams] = useSearchParams();
  const page = parseInt(params.get('page') || '1', 10);
  const status = params.get('status') || '';
  const category = params.get('category') || '';
  const startDate = params.get('startDate') || '';
  const endDate = params.get('endDate') || '';

  const [open, setOpen] = useState(false);
  const [f, setF] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [reject, setReject] = useState(null);
  const [reason, setReason] = useState('');
  const [paid, setPaid] = useState(null);
  const [payMethod, setPayMethod] = useState('Cash');
  const [payRef, setPayRef] = useState('');

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.set('page', '1');
    setParams(next);
  };

  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => (await api.get('/finance/expense-categories')).data.data.categories || [],
  });
  const { data: years = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => (await api.get('/academic/years')).data.data.academicYears,
  });
  const year = years.find((y) => y.isCurrent)?._id;

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', page, status, category, startDate, endDate],
    queryFn: async () => {
      const q = new URLSearchParams({ page, limit: 20 });
      if (status) q.set('status', status);
      if (category) q.set('category', category);
      if (startDate) q.set('startDate', startDate);
      if (endDate) q.set('endDate', endDate);
      return (await api.get(`/finance/expenses?${q}`)).data;
    },
    keepPreviousData: true,
  });
  const expenses = data?.data?.expenses || [];
  const summary = data?.data?.summary || {};
  const pg = data?.pagination || {};

  const fail = (err) => toast.error(err.response?.data?.message || 'Request failed.');
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['expenses'] });
    qc.invalidateQueries({ queryKey: ['finance-dashboard'] });
  };

  const create = useMutation({
    mutationFn: (p) => api.post('/finance/expenses', p),
    onSuccess: (res) => {
      toast.success(res.data.message);
      refresh();
      setOpen(false);
    },
    onError: fail,
  });
  const approve = useMutation({
    mutationFn: (id) => api.post(`/finance/expenses/${id}/approve`, {}),
    onSuccess: (res) => {
      toast.success(res.data.message);
      refresh();
    },
    onError: fail,
  });
  const doReject = useMutation({
    mutationFn: ({ id, body }) => api.post(`/finance/expenses/${id}/reject`, body),
    onSuccess: () => {
      toast.success('Expense rejected.');
      refresh();
      setReject(null);
    },
    onError: fail,
  });
  const markPaid = useMutation({
    mutationFn: ({ id, body }) => api.post(`/finance/expenses/${id}/mark-paid`, body),
    onSuccess: () => {
      toast.success('Expense marked as paid.');
      refresh();
      setPaid(null);
    },
    onError: fail,
  });
  const cancel = useMutation({
    mutationFn: (id) => api.delete(`/finance/expenses/${id}`),
    onSuccess: () => {
      toast.success('Expense cancelled.');
      refresh();
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
    if (!f.title.trim()) er.title = 'Required';
    if (!f.category) er.category = 'Required';
    if (!f.amount || parseFloat(f.amount) <= 0) er.amount = 'Enter a valid amount';
    if (!f.date) er.date = 'Required';
    setErrors(er);
    if (Object.keys(er).length) {
      return;
    }
    create.mutate({
      title: f.title.trim(),
      category: f.category,
      amount: parseFloat(f.amount),
      taxAmount: parseFloat(f.taxAmount) || 0,
      date: f.date,
      academicYear: year,
      vendor: f.vendor || undefined,
      invoiceNumber: f.invoiceNumber || undefined,
      description: f.description || undefined,
    });
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Submit, approve and pay school expenses</p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setF(emptyForm());
            setErrors({});
            setOpen(true);
          }}
        >
          Record expense
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-2xl font-bold text-red-700">{money(summary.total)}</p>
          <p className="text-xs text-slate-500">Total expenses (current filter)</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-slate-900">{summary.count ?? 0}</p>
          <p className="text-xs text-slate-500">Records</p>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
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
        <select
          className="form-select w-48"
          value={category}
          onChange={(e) => setParam('category', e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="form-select w-36"
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
                <th>Title</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Vendor</th>
                <th>Date</th>
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
              {!isLoading && expenses.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No expenses recorded
                  </td>
                </tr>
              )}
              {expenses.map((x) => (
                <tr key={x._id}>
                  <td>
                    <p className="font-medium text-slate-900">{x.title}</p>
                    {x.invoiceNumber && (
                      <p className="text-xs text-slate-400">Inv: {x.invoiceNumber}</p>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-gray">{catName(x)}</span>
                  </td>
                  <td className="font-bold text-red-600">{money(x.amount)}</td>
                  <td>{x.vendor || '-'}</td>
                  <td>{fmt(x.date)}</td>
                  <td>
                    <span className={`badge capitalize ${badge(x.status)}`}>{x.status}</span>
                  </td>
                  <td className="text-right space-x-2">
                    {canApprove && x.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          className="btn-success btn-sm"
                          onClick={() => approve.mutate(x._id)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn-danger btn-sm"
                          onClick={() => {
                            setReason('');
                            setReject(x);
                          }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {canApprove && x.status === 'approved' && (
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        onClick={() => {
                          setPayMethod('Cash');
                          setPayRef('');
                          setPaid(x);
                        }}
                      >
                        Mark paid
                      </button>
                    )}
                    {canCancel && ['pending', 'approved'].includes(x.status) && (
                      <button
                        type="button"
                        className="btn-outline btn-sm"
                        onClick={() =>
                          window.confirm('Cancel this expense?') && cancel.mutate(x._id)
                        }
                      >
                        Cancel
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
              Page {page} of {pg.totalPages} ({pg.total} records)
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

      <Modal open={open} title="Record expense" onClose={() => setOpen(false)}>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              className={cls('title')}
              value={f.title}
              onChange={set('title')}
              placeholder="Electricity bill"
            />
            {err('title')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className={errors.category ? 'form-input-error' : 'form-select'}
                value={f.category}
                onChange={set('category')}
              >
                <option value="">Select</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {err('category')}
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                max={today()}
                className={cls('date')}
                value={f.date}
                onChange={set('date')}
              />
              {err('date')}
            </div>
            <div className="form-group">
              <label className="form-label">Amount (ETB)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className={cls('amount')}
                value={f.amount}
                onChange={set('amount')}
              />
              {err('amount')}
            </div>
            <div className="form-group">
              <label className="form-label">Tax amount (ETB)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-input"
                value={f.taxAmount}
                onChange={set('taxAmount')}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Vendor</label>
              <input className="form-input" value={f.vendor} onChange={set('vendor')} />
            </div>
            <div className="form-group">
              <label className="form-label">Invoice number</label>
              <input
                className="form-input"
                value={f.invoiceNumber}
                onChange={set('invoiceNumber')}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={f.description}
              onChange={set('description')}
            />
          </div>
          <button type="submit" disabled={create.isPending} className="btn-primary w-full">
            {create.isPending ? 'Submitting...' : 'Submit for approval'}
          </button>
        </form>
      </Modal>

      <Modal open={!!reject} title="Reject expense" onClose={() => setReject(null)}>
        <div className="form-group">
          <label className="form-label">Reason (required)</label>
          <textarea
            className="form-textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn-danger w-full"
          disabled={doReject.isPending}
          onClick={() =>
            reason.trim()
              ? doReject.mutate({ id: reject._id, body: { reason: reason.trim() } })
              : toast.error('A reason is required.')
          }
        >
          {doReject.isPending ? 'Saving...' : 'Reject expense'}
        </button>
      </Modal>

      <Modal open={!!paid} title="Mark expense as paid" onClose={() => setPaid(null)}>
        <div className="form-group">
          <label className="form-label">Payment method</label>
          <select
            className="form-select"
            value={payMethod}
            onChange={(e) => setPayMethod(e.target.value)}
          >
            {METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Payment reference</label>
          <input
            className="form-input"
            value={payRef}
            onChange={(e) => setPayRef(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn-primary w-full"
          disabled={markPaid.isPending}
          onClick={() =>
            markPaid.mutate({
              id: paid._id,
              body: { paymentMethod: payMethod, paymentReference: payRef || undefined },
            })
          }
        >
          {markPaid.isPending ? 'Saving...' : 'Confirm payment'}
        </button>
      </Modal>
    </div>
  );
};

export default ExpensesPage;
