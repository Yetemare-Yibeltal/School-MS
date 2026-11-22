import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/common/Modal';

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const METHODS = ['Cash', 'Bank Transfer', 'Telebirr', 'CBE Birr', 'Cheque', 'Other'];
const STATUSES = ['unpaid', 'partial', 'paid', 'overdue', 'cancelled'];
const money = (n) => `ETB ${Number(n || 0).toLocaleString()}`;
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-GB') : '-');
const today = () => new Date().toISOString().split('T')[0];
const idOf = (v) => (v && typeof v === 'object' ? v._id : v);
const studentName = (a) =>
  a.studentName ||
  (a.student && typeof a.student === 'object'
    ? `${a.student.firstName || ''} ${a.student.fatherName || ''}`.trim()
    : '-');
const feeName = (a) =>
  a.feeTypeName || (a.feeType && typeof a.feeType === 'object' ? a.feeType.name : '-');
const net = (a) => a.netAmount ?? a.amount ?? 0;
const paid = (a) => a.paidAmount ?? 0;
const remaining = (a) => a.remainingAmount ?? Math.max(net(a) - paid(a), 0);

const FeeCollectionPage = () => {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const page = parseInt(params.get('page') || '1', 10);
  const search = params.get('search') || '';
  const grade = params.get('grade') || '';
  const status = params.get('status') || '';

  const [payModal, setPayModal] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [pay, setPay] = useState({
    amount: '',
    method: 'Cash',
    transactionReference: '',
    payerName: '',
    payerPhone: '',
    notes: '',
  });
  const [asg, setAsg] = useState({
    grade: '',
    section: '',
    feeType: '',
    term: '',
    amount: '',
    dueDate: '',
    notes: '',
  });

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.set('page', '1');
    setParams(next);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['fee-assignments', page, search, grade, status],
    queryFn: async () => {
      const q = new URLSearchParams({ page, limit: 20 });
      if (search) q.set('search', search);
      if (grade) q.set('grade', grade);
      if (status) q.set('status', status);
      return (await api.get(`/finance/assignments?${q}`)).data;
    },
    keepPreviousData: true,
  });
  const { data: years = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => (await api.get('/academic/years')).data.data.academicYears,
  });
  const year = years.find((y) => y.isCurrent)?._id;
  const { data: terms = [] } = useQuery({
    queryKey: ['terms', year],
    queryFn: async () => (await api.get(`/academic/terms?academicYear=${year}`)).data.data.terms,
    enabled: !!year && assignOpen,
  });
  const { data: feeTypes = [] } = useQuery({
    queryKey: ['fee-types', ''],
    queryFn: async () => (await api.get('/finance/fee-types')).data.data.feeTypes,
    enabled: assignOpen,
  });
  const { data: sections = [] } = useQuery({
    queryKey: ['sections', asg.grade],
    queryFn: async () =>
      (await api.get(`/academic/sections?grade=${asg.grade}`)).data.data.sections,
    enabled: !!asg.grade && assignOpen,
  });

  const assignments = data?.data?.assignments || [];
  const pg = data?.pagination || {};

  const fail = (err) => toast.error(err.response?.data?.message || 'Request failed.');
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['fee-assignments'] });
    qc.invalidateQueries({ queryKey: ['finance-dashboard'] });
  };

  const collect = useMutation({
    mutationFn: (payload) => api.post('/finance/payments', payload),
    onSuccess: (res) => {
      toast.success(res.data.message);
      setReceipt({ payment: res.data.data.payment, receipt: res.data.data.receipt });
      setPayModal(null);
      refresh();
    },
    onError: fail,
  });
  const assign = useMutation({
    mutationFn: (payload) => api.post('/finance/assignments/bulk', payload),
    onSuccess: (res) => {
      toast.success(res.data.message);
      setAssignOpen(false);
      refresh();
    },
    onError: fail,
  });

  const openPay = (a) => {
    setPay({
      amount: String(remaining(a)),
      method: 'Cash',
      transactionReference: '',
      payerName: '',
      payerPhone: '',
      notes: '',
    });
    setPayModal(a);
  };

  const submitPay = (e) => {
    e.preventDefault();
    const amount = parseFloat(pay.amount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount.');
      return;
    }
    if (amount > remaining(payModal)) {
      toast.error(`Amount cannot exceed the balance (${money(remaining(payModal))}).`);
      return;
    }
    if (!pay.payerName.trim()) {
      toast.error('Payer name is required.');
      return;
    }
    collect.mutate({
      feeAssignment: payModal._id,
      student: idOf(payModal.student),
      amount,
      method: pay.method,
      paymentDate: today(),
      transactionReference: pay.transactionReference || undefined,
      paidBy: {
        name: pay.payerName.trim(),
        phone: pay.payerPhone || undefined,
        relationship: 'Parent/Guardian',
      },
      notes: pay.notes || undefined,
      generateReceipt: true,
    });
  };

  const submitAssign = (e) => {
    e.preventDefault();
    if (!asg.grade || !asg.feeType || !asg.amount || !asg.dueDate) {
      toast.error('Grade, fee type, amount and due date are required.');
      return;
    }
    assign.mutate({
      grade: asg.grade,
      section: asg.section || undefined,
      feeType: asg.feeType,
      academicYear: year,
      term: asg.term || undefined,
      amount: parseFloat(asg.amount),
      dueDate: asg.dueDate,
      notes: asg.notes || undefined,
    });
  };

  const pickFee = (id) => {
    const t = feeTypes.find((x) => x._id === id);
    setAsg((p) => ({ ...p, feeType: id, amount: t ? String(t.amount) : p.amount }));
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fee Collection</h1>
          <p className="page-subtitle">
            {pg.total ? `${pg.total} fee assignments` : 'Assign and collect student fees'}
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setAssignOpen(true)}>
          Assign fee to class
        </button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <input
          type="search"
          className="form-input flex-1 min-w-[200px]"
          placeholder="Search student or fee..."
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
                <th>Student</th>
                <th>Fee</th>
                <th>Net</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Due</th>
                <th>Status</th>
                <th className="text-right">Action</th>
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
              {!isLoading && assignments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No fee assignments yet. Use "Assign fee to class" first.
                  </td>
                </tr>
              )}
              {assignments.map((a) => {
                const late = a.dueDate && new Date(a.dueDate) < new Date() && a.status !== 'paid';
                return (
                  <tr key={a._id} className={late ? 'bg-red-50/30' : ''}>
                    <td>{studentName(a)}</td>
                    <td>{feeName(a)}</td>
                    <td>{money(net(a))}</td>
                    <td className="text-green-700">{money(paid(a))}</td>
                    <td
                      className={remaining(a) > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}
                    >
                      {money(remaining(a))}
                    </td>
                    <td className={late ? 'text-red-600' : ''}>{fmt(a.dueDate)}</td>
                    <td>
                      <span
                        className={`badge capitalize ${
                          a.status === 'paid'
                            ? 'badge-success'
                            : a.status === 'partial'
                            ? 'badge-warning'
                            : a.status === 'overdue'
                            ? 'badge-danger'
                            : 'badge-gray'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="text-right">
                      {a.status !== 'paid' && a.status !== 'cancelled' ? (
                        <button
                          type="button"
                          className="btn-primary btn-sm"
                          onClick={() => openPay(a)}
                        >
                          Collect
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
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

      <Modal open={!!payModal} title="Collect payment" onClose={() => setPayModal(null)}>
        {payModal && (
          <form onSubmit={submitPay}>
            <div className="p-3 bg-indigo-50 rounded-xl mb-4 text-sm grid grid-cols-3 text-center">
              <div>
                <p className="text-xs text-slate-500">Total</p>
                <b>{money(net(payModal))}</b>
              </div>
              <div>
                <p className="text-xs text-slate-500">Paid</p>
                <b className="text-green-700">{money(paid(payModal))}</b>
              </div>
              <div>
                <p className="text-xs text-slate-500">Balance</p>
                <b className="text-red-600">{money(remaining(payModal))}</b>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              {studentName(payModal)} · {feeName(payModal)}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">Amount (ETB)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  className="form-input"
                  value={pay.amount}
                  onChange={(e) => setPay((p) => ({ ...p, amount: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Method</label>
                <select
                  className="form-select"
                  value={pay.method}
                  onChange={(e) => setPay((p) => ({ ...p, method: e.target.value }))}
                >
                  {METHODS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            {pay.method !== 'Cash' && (
              <div className="form-group">
                <label className="form-label">Transaction reference</label>
                <input
                  className="form-input"
                  value={pay.transactionReference}
                  onChange={(e) => setPay((p) => ({ ...p, transactionReference: e.target.value }))}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">Paid by</label>
                <input
                  className="form-input"
                  value={pay.payerName}
                  onChange={(e) => setPay((p) => ({ ...p, payerName: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Payer phone</label>
                <input
                  className="form-input"
                  value={pay.payerPhone}
                  onChange={(e) => setPay((p) => ({ ...p, payerPhone: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                value={pay.notes}
                onChange={(e) => setPay((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
            <button type="submit" disabled={collect.isPending} className="btn-primary w-full">
              {collect.isPending ? 'Processing...' : `Collect ${money(pay.amount)}`}
            </button>
          </form>
        )}
      </Modal>

      <Modal open={assignOpen} title="Assign fee to class" onClose={() => setAssignOpen(false)}>
        <form onSubmit={submitAssign}>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Grade</label>
              <select
                className="form-select"
                value={asg.grade}
                onChange={(e) => setAsg((p) => ({ ...p, grade: e.target.value, section: '' }))}
              >
                <option value="">Select</option>
                {GRADES.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Section (optional)</label>
              <select
                className="form-select"
                value={asg.section}
                disabled={!asg.grade}
                onChange={(e) => setAsg((p) => ({ ...p, section: e.target.value }))}
              >
                <option value="">All sections</option>
                {sections.map((s) => (
                  <option key={s._id} value={s._id}>
                    Section {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Fee type</label>
            <select
              className="form-select"
              value={asg.feeType}
              onChange={(e) => pickFee(e.target.value)}
            >
              <option value="">Select</option>
              {feeTypes.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({money(t.amount)})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Amount per student</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={asg.amount}
                onChange={(e) => setAsg((p) => ({ ...p, amount: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Due date</label>
              <input
                type="date"
                className="form-input"
                value={asg.dueDate}
                onChange={(e) => setAsg((p) => ({ ...p, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Term (optional)</label>
            <select
              className="form-select"
              value={asg.term}
              onChange={(e) => setAsg((p) => ({ ...p, term: e.target.value }))}
            >
              <option value="">None</option>
              {terms.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={assign.isPending} className="btn-primary w-full">
            {assign.isPending ? 'Assigning...' : 'Assign to all students'}
          </button>
        </form>
      </Modal>

      <Modal open={!!receipt} title="Payment receipt" onClose={() => setReceipt(null)}>
        {receipt && (
          <div className="space-y-2 text-sm">
            <div className="text-center mb-3">
              <h4 className="font-bold">Kat Secondary School</h4>
              <p className="text-xs text-slate-500">Addis Ababa, Ethiopia</p>
            </div>
            {[
              ['Receipt no.', receipt.receipt?.receiptNumber || receipt.payment?.receiptNumber],
              ['Amount', money(receipt.payment?.amount)],
              ['Method', receipt.payment?.method],
              ['Date', fmt(receipt.payment?.paymentDate)],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between border-b border-dashed border-slate-200 pb-1"
              >
                <span className="text-slate-500">{k}</span>
                <b>{v || '-'}</b>
              </div>
            ))}
           
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FeeCollectionPage;
