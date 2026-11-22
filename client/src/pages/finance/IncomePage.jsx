import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { useAuthStore } from '../../store/authStore';

const CATEGORY_HINTS = [
  'Government Grant',
  'Donation',
  'Bank Interest',
  'Rental',
  'Event',
  'Fundraising',
  'Other',
];
const METHODS = ['Cash', 'Bank Transfer', 'Telebirr', 'CBE Birr', 'Cheque', 'Other'];
const money = (n) => `ETB ${Number(n || 0).toLocaleString()}`;
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-GB') : '-');
const today = () => new Date().toISOString().split('T')[0];

const emptyForm = () => ({
  title: '',
  category: '',
  amount: '',
  paymentMethod: 'Cash',
  date: today(),
  source: '',
  transactionReference: '',
  invoiceNumber: '',
  description: '',
});

const IncomePage = () => {
  const qc = useQueryClient();
  const canDelete = ['super_admin', 'admin'].includes(useAuthStore((s) => s.user?.role));
  const [params, setParams] = useSearchParams();
  const page = parseInt(params.get('page') || '1', 10);
  const startDate = params.get('startDate') || '';
  const endDate = params.get('endDate') || '';
  const search = params.get('search') || '';

  const [open, setOpen] = useState(false);
  const [f, setF] = useState(emptyForm());
  const [errors, setErrors] = useState({});

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.set('page', '1');
    setParams(next);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['income', page, startDate, endDate, search],
    queryFn: async () => {
      const q = new URLSearchParams({ page, limit: 20 });
      if (startDate) q.set('startDate', startDate);
      if (endDate) q.set('endDate', endDate);
      if (search) q.set('search', search);
      return (await api.get(`/finance/income?${q}`)).data;
    },
    keepPreviousData: true,
  });
  const { data: years = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => (await api.get('/academic/years')).data.data.academicYears,
  });
  const year = years.find((y) => y.isCurrent)?._id;

  const records = data?.data?.income || [];
  const summary = data?.data?.summary || {};
  const pg = data?.pagination || {};

  const fail = (err) => toast.error(err.response?.data?.message || 'Request failed.');
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['income'] });
    qc.invalidateQueries({ queryKey: ['finance-dashboard'] });
  };

  const create = useMutation({
    mutationFn: (p) => api.post('/finance/income', p),
    onSuccess: () => {
      toast.success('Income recorded.');
      refresh();
      setOpen(false);
    },
    onError: fail,
  });
  const cancel = useMutation({
    mutationFn: (id) => api.delete(`/finance/income/${id}`),
    onSuccess: () => {
      toast.success('Income cancelled.');
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
    if (!f.category.trim()) er.category = 'Required';
    if (!f.amount || parseFloat(f.amount) <= 0) er.amount = 'Enter a valid amount';
    if (!f.date) er.date = 'Required';
    setErrors(er);
    if (Object.keys(er).length) {
      return;
    }
    create.mutate({
      title: f.title.trim(),
      category: f.category.trim(),
      amount: parseFloat(f.amount),
      paymentMethod: f.paymentMethod,
      date: f.date,
      academicYear: year,
      source: f.source || undefined,
      transactionReference: f.transactionReference || undefined,
      invoiceNumber: f.invoiceNumber || undefined,
      description: f.description || undefined,
    });
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Income</h1>
          <p className="page-subtitle">Non-fee income records</p>
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
          Record income
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-2xl font-bold text-green-700">{money(summary.total)}</p>
          <p className="text-xs text-slate-500">Total income (current filter)</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-slate-900">{summary.count ?? 0}</p>
          <p className="text-xs text-slate-500">Records</p>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <input
          type="search"
          className="form-input flex-1 min-w-[180px]"
          placeholder="Search..."
          value={search}
          onChange={(e) => setParam('search', e.target.value)}
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
      </div>

      <div className="card overflow-hidden">
        <div className="table-container rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Date</th>
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
              {!isLoading && records.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No income records
                  </td>
                </tr>
              )}
              {records.map((r) => (
                <tr key={r._id}>
                  <td>
                    <p className="font-medium text-slate-900">{r.title}</p>
                    {r.description && (
                      <p className="text-xs text-slate-400 truncate max-w-[200px]">
                        {r.description}
                      </p>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-success">{r.category}</span>
                  </td>
                  <td className="font-bold text-green-700">{money(r.amount)}</td>
                  <td>{r.paymentMethod || '-'}</td>
                  <td className="text-xs font-mono text-slate-500">
                    {r.transactionReference || r.invoiceNumber || '-'}
                  </td>
                  <td>{fmt(r.date)}</td>
                  <td className="capitalize">{r.status || '-'}</td>
                  <td className="text-right">
                    {canDelete && r.status !== 'cancelled' && (
                      <button
                        type="button"
                        className="btn-danger btn-sm"
                        onClick={() =>
                          window.confirm('Cancel this income record?') && cancel.mutate(r._id)
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

      <Modal open={open} title="Record income" onClose={() => setOpen(false)}>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              className={cls('title')}
              value={f.title}
              onChange={set('title')}
              placeholder="Government grant Q1"
            />
            {err('title')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Category</label>
              <input
                className={cls('category')}
                list="income-categories"
                value={f.category}
                onChange={set('category')}
              />
              <datalist id="income-categories">
                {CATEGORY_HINTS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {err('category')}
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
              <label className="form-label">Payment method</label>
              <select
                className="form-select"
                value={f.paymentMethod}
                onChange={set('paymentMethod')}
              >
                {METHODS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
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
              <label className="form-label">Source</label>
              <input
                className="form-input"
                value={f.source}
                onChange={set('source')}
                placeholder="Who paid"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Transaction reference</label>
              <input
                className="form-input"
                value={f.transactionReference}
                onChange={set('transactionReference')}
              />
            </div>
            <div className="form-group col-span-2">
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
            {create.isPending ? 'Saving...' : 'Record income'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default IncomePage;
