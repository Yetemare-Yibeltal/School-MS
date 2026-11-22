import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { useAuthStore } from '../../store/authStore';

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const METHODS = ['Cash', 'Bank Transfer', 'Telebirr', 'CBE Birr', 'Cheque', 'Other'];
const money = (n) => `ETB ${Number(n || 0).toLocaleString()}`;
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-GB') : '-');
const studentName = (p) =>
  p.studentName ||
  (p.student && typeof p.student === 'object'
    ? `${p.student.firstName || ''} ${p.student.fatherName || ''}`.trim()
    : '-');
const feeName = (p) =>
  p.feeTypeName || (p.feeType && typeof p.feeType === 'object' ? p.feeType.name : '-');
const collector = (p) =>
  p.collectedByName ||
  (p.collectedBy && typeof p.collectedBy === 'object'
    ? `${p.collectedBy.firstName || ''} ${p.collectedBy.fatherName || ''}`.trim()
    : '-');

const PaymentsPage = () => {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const canRefund = ['super_admin', 'admin', 'accountant'].includes(role);
  const [params, setParams] = useSearchParams();

  const page = parseInt(params.get('page') || '1', 10);
  const search = params.get('search') || '';
  const grade = params.get('grade') || '';
  const method = params.get('method') || '';
  const startDate = params.get('startDate') || '';
  const endDate = params.get('endDate') || '';

  const [receipt, setReceipt] = useState(null);
  const [refund, setRefund] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.set('page', '1');
    setParams(next);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, search, grade, method, startDate, endDate],
    queryFn: async () => {
      const q = new URLSearchParams({ page, limit: 20 });
      if (search) q.set('search', search);
      if (grade) q.set('grade', grade);
      if (method) q.set('method', method);
      if (startDate) q.set('startDate', startDate);
      if (endDate) q.set('endDate', endDate);
      return (await api.get(`/finance/payments?${q}`)).data;
    },
    keepPreviousData: true,
  });

  const payments = data?.data?.payments || [];
  const summary = data?.data?.summary || {};
  const pg = data?.pagination || {};

  const doRefund = useMutation({
    mutationFn: ({ id, body }) => api.post(`/finance/payments/${id}/refund`, body),
    onSuccess: (res) => {
      toast.success(res.data.message);
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['fee-assignments'] });
      qc.invalidateQueries({ queryKey: ['finance-dashboard'] });
      setRefund(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Refund failed.'),
  });

  const openRefund = (p) => {
    setRefundAmount(String(p.amount));
    setRefundReason('');
    setRefund(p);
  };

  const submitRefund = () => {
    const amount = parseFloat(refundAmount);
    if (!amount || amount <= 0 || amount > refund.amount) {
      toast.error(`Refund must be between 1 and ${money(refund.amount)}.`);
      return;
    }
    if (!refundReason.trim()) {
      toast.error('A refund reason is required.');
      return;
    }
    doRefund.mutate({
      id: refund._id,
      body: { refundAmount: amount, refundReason: refundReason.trim() },
    });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">
            {pg.total ? `${pg.total} payment records` : 'All fee payments'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-2xl font-bold text-green-700">{money(summary.totalAmount)}</p>
          <p className="text-xs text-slate-500">Total collected (current filter)</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-bold text-slate-900">{summary.count ?? 0}</p>
          <p className="text-xs text-slate-500">Payments</p>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <input
          type="search"
          className="form-input flex-1 min-w-[180px]"
          placeholder="Search name or receipt..."
          value={search}
          onChange={(e) => setParam('search', e.target.value)}
        />
        <input
          type="date"
          max={today}
          className="form-input w-40"
          value={startDate}
          onChange={(e) => setParam('startDate', e.target.value)}
        />
        <input
          type="date"
          max={today}
          min={startDate}
          className="form-input w-40"
          value={endDate}
          onChange={(e) => setParam('endDate', e.target.value)}
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
          value={method}
          onChange={(e) => setParam('method', e.target.value)}
        >
          <option value="">All methods</option>
          {METHODS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        {(search || grade || method || startDate || endDate) && (
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
                <th>Receipt</th>
                <th>Student</th>
                <th>Fee</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
                <th>Collected by</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              )}
              {!isLoading && payments.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No payments found
                  </td>
                </tr>
              )}
              {payments.map((p) => (
                <tr key={p._id} className={p.isRefunded ? 'bg-red-50/30' : ''}>
                  <td>
                    <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">
                      {p.receiptNumber || '-'}
                    </span>
                  </td>
                  <td>{studentName(p)}</td>
                  <td>{feeName(p)}</td>
                  <td
                    className={
                      p.isRefunded ? 'line-through text-red-500' : 'font-bold text-green-700'
                    }
                  >
                    {money(p.amount)}
                  </td>
                  <td>
                    <span className="badge badge-gray">{p.method}</span>
                  </td>
                  <td>{fmt(p.paymentDate)}</td>
                  <td className="text-xs text-slate-500">{collector(p)}</td>
                  <td>
                    <span className={`badge ${p.isRefunded ? 'badge-danger' : 'badge-success'}`}>
                      {p.isRefunded ? 'Refunded' : 'Completed'}
                    </span>
                  </td>
                  <td className="text-right space-x-2">
                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      onClick={() => setReceipt(p)}
                    >
                      Receipt
                    </button>
                    {canRefund && !p.isRefunded && (
                      <button
                        type="button"
                        className="btn-danger btn-sm"
                        onClick={() => openRefund(p)}
                      >
                        Refund
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

      <Modal open={!!receipt} title="Payment receipt" onClose={() => setReceipt(null)}>
        {receipt && (
          <div className="space-y-2 text-sm">
            <div className="text-center mb-3">
              <h4 className="font-bold text-slate-900">Kat Secondary School</h4>
              <p className="text-xs text-slate-500">Addis Ababa, Ethiopia</p>
            </div>
            {[
              ['Receipt no.', receipt.receiptNumber],
              ['Student', studentName(receipt)],
              ['Fee', feeName(receipt)],
              ['Method', receipt.method],
              ['Reference', receipt.transactionReference],
              ['Date', fmt(receipt.paymentDate)],
              ['Collected by', collector(receipt)],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between border-b border-dashed border-slate-200 pb-1"
              >
                <span className="text-slate-500">{k}</span>
                <b>{v || '-'}</b>
              </div>
            ))}
            <div className="flex justify-between text-base pt-2">
              <span>Amount paid</span>
              <b className="text-green-700">{money(receipt.amount)}</b>
            </div>
            <button
              type="button"
              className="btn-outline w-full mt-3"
              onClick={() => window.print()}
            >
              Print receipt
            </button>
          </div>
        )}
      </Modal>

      <Modal open={!!refund} title="Process refund" onClose={() => setRefund(null)}>
        {refund && (
          <div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-800">
              Refunding a payment of <b>{money(refund.amount)}</b> to {studentName(refund)} (receipt{' '}
              {refund.receiptNumber}).
            </div>
            <div className="form-group">
              <label className="form-label">Refund amount (ETB)</label>
              <input
                type="number"
                min="1"
                max={refund.amount}
                className="form-input"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Reason</label>
              <textarea
                className="form-textarea"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Why is this payment being refunded?"
              />
            </div>
            <button
              type="button"
              className="btn-danger w-full"
              disabled={doRefund.isPending}
              onClick={submitRefund}
            >
              {doRefund.isPending ? 'Processing...' : 'Process refund'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentsPage;
