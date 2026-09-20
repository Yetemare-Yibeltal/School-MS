// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// FEE COLLECTION PAGE
// kat-school/client/src/pages/finance/FeeCollectionPage.jsx
// ============================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Telebirr', 'CBE Birr', 'Cheque', 'Other'];

const PaymentModal = ({ assignment, student, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    amount: String(assignment.remainingAmount || ''),
    method: 'Cash',
    transactionReference: '',
    payerName: student ? `${student.firstName} ${student.fatherName}` : '',
    payerPhone: '',
    sendEmailReceipt: false,
    notes: '',
  });
  const [errors, setErrors] = useState({});

  const collectMutation = useMutation({
    mutationFn: (data) => api.post('/finance/payments', data),
    onSuccess: (res) => {
      toast.success(
        `Payment of ETB ${form.amount} collected! Receipt: ${res.data.data.payment.receiptNumber}`
      );
      onSuccess();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Payment failed.'),
  });

  const validate = () => {
    const newErrors = {};
    if (!form.amount || parseFloat(form.amount) <= 0)
      newErrors.amount = 'Valid amount is required.';
    if (parseFloat(form.amount) > assignment.remainingAmount) {
      newErrors.amount = `Cannot exceed remaining balance (ETB ${assignment.remainingAmount}).`;
    }
    if (!form.method) newErrors.method = 'Payment method is required.';
    if (!form.payerName.trim()) newErrors.payerName = 'Payer name is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    collectMutation.mutate({
      feeAssignment: assignment._id,
      student: assignment.student?._id || assignment.student,
      amount: parseFloat(form.amount),
      method: form.method,
      paymentDate: new Date().toISOString().split('T')[0],
      transactionReference: form.transactionReference || undefined,
      paidBy: {
        name: form.payerName.trim(),
        relationship: 'Parent/Guardian',
        phone: form.payerPhone || undefined,
      },
      notes: form.notes || undefined,
      generateReceipt: true,
      sendEmailReceipt: form.sendEmailReceipt,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold">Collect Payment</h3>
            <p className="text-xs text-slate-500">
              {assignment.feeTypeName} — {assignment.studentName}
            </p>
          </div>
          <button onClick={onClose} className="btn-icon btn-ghost">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Fee Summary */}
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div>
                <p className="text-xs text-slate-500">Total Fee</p>
                <p className="font-bold text-slate-900">
                  ETB {Number(assignment.netAmount).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Paid</p>
                <p className="font-bold text-green-700">
                  ETB {Number(assignment.paidAmount).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Balance</p>
                <p className="font-bold text-red-600">
                  ETB {Number(assignment.remainingAmount).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group mb-0">
              <label className="form-label">
                Amount (ETB) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => {
                  setForm((p) => ({ ...p, amount: e.target.value }));
                  if (errors.amount) setErrors((p) => ({ ...p, amount: null }));
                }}
                min="1"
                max={assignment.remainingAmount}
                step="0.01"
                placeholder="Amount to collect"
                className={errors.amount ? 'form-input-error' : 'form-input'}
                autoFocus
              />
              {errors.amount && <p className="form-error">{errors.amount}</p>}
            </div>
            <div className="form-group mb-0">
              <label className="form-label">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                value={form.method}
                onChange={(e) => setForm((p) => ({ ...p, method: e.target.value }))}
                className="form-select"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {form.method !== 'Cash' && (
            <div className="form-group mb-0">
              <label className="form-label">Transaction Reference</label>
              <input
                type="text"
                value={form.transactionReference}
                onChange={(e) => setForm((p) => ({ ...p, transactionReference: e.target.value }))}
                placeholder="Transaction ID / Cheque number"
                className="form-input"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group mb-0">
              <label className="form-label">
                Paid By (Name) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.payerName}
                onChange={(e) => {
                  setForm((p) => ({ ...p, payerName: e.target.value }));
                  if (errors.payerName) setErrors((p) => ({ ...p, payerName: null }));
                }}
                className={errors.payerName ? 'form-input-error' : 'form-input'}
              />
              {errors.payerName && <p className="form-error">{errors.payerName}</p>}
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Payer Phone</label>
              <input
                type="tel"
                value={form.payerPhone}
                onChange={(e) => setForm((p) => ({ ...p, payerPhone: e.target.value }))}
                placeholder="+251..."
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              className="form-textarea"
              rows={2}
              placeholder="Optional notes..."
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.sendEmailReceipt}
              onChange={(e) => setForm((p) => ({ ...p, sendEmailReceipt: e.target.checked }))}
              className="form-checkbox"
            />
            <span className="text-sm text-slate-600">Send email receipt to parent</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={collectMutation.isPending}
              className="btn-primary flex-1"
            >
              {collectMutation.isPending ? (
                <>
                  <div className="spinner-sm" /> Processing...
                </>
              ) : (
                `💳 Collect ETB ${parseFloat(form.amount || 0).toLocaleString()}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FeeCollectionPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [paymentModal, setPaymentModal] = useState({ open: false, assignment: null });

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const grade = searchParams.get('grade') || '';
  const status = searchParams.get('status') || '';

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    value ? next.set(key, value) : next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['fee-assignments', { page, search, grade, status }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(search && { search }),
        ...(grade && { grade }),
        ...(status && { status }),
      });
      const res = await api.get(`/finance/assignments?${params}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  const assignments = data?.data?.assignments || [];
  const pagination = data?.pagination || {};
  const summary = data?.data?.summary || {};

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fee Collection</h1>
          <p className="page-subtitle">
            {pagination.total ? `${pagination.total} fee assignments` : 'Collect student fees'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => updateParam('search', e.target.value)}
              placeholder="Search by student name, ID, fee type..."
              className="form-input pl-9"
            />
          </div>
          <select
            value={grade}
            onChange={(e) => updateParam('grade', e.target.value)}
            className="form-select w-32"
          >
            <option value="">All Grades</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => updateParam('status', e.target.value)}
            className="form-select w-32"
          >
            <option value="">All Status</option>
            {['paid', 'partial', 'unpaid', 'overdue'].map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
          {(search || grade || status) && (
            <button onClick={() => setSearchParams({ page: '1' })} className="btn-ghost text-sm">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Assignments Table */}
      <div className="card overflow-hidden">
        <div className="table-container rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Grade</th>
                <th>Fee Type</th>
                <th>Total Fee</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Due Date</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j}>
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="text-4xl mb-3">💳</div>
                    <p className="text-slate-500">No fee assignments found</p>
                  </td>
                </tr>
              ) : (
                assignments.map((assignment) => {
                  const isOverdue =
                    assignment.dueDate &&
                    new Date(assignment.dueDate) < new Date() &&
                    assignment.status !== 'paid';
                  return (
                    <tr
                      key={assignment._id}
                      className={`hover:bg-slate-50 ${isOverdue ? 'bg-red-50/20' : ''}`}
                    >
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-indigo-700 font-semibold text-xs">
                            {assignment.student?.photo?.url ? (
                              <img
                                src={assignment.student.photo.url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              assignment.studentName?.[0]
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {assignment.studentName}
                            </p>
                            <p className="text-xs text-slate-400">{assignment.studentId}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-primary text-xs">{assignment.grade}</span>
                      </td>
                      <td className="text-sm text-slate-700">{assignment.feeTypeName}</td>
                      <td className="text-sm font-medium">
                        ETB {Number(assignment.netAmount).toLocaleString()}
                      </td>
                      <td className="text-sm text-green-700 font-medium">
                        ETB {Number(assignment.paidAmount).toLocaleString()}
                      </td>
                      <td>
                        <span
                          className={`text-sm font-bold ${
                            assignment.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          ETB {Number(assignment.remainingAmount).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        {assignment.dueDate && (
                          <span
                            className={`text-xs ${
                              isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'
                            }`}
                          >
                            {new Date(assignment.dueDate).toLocaleDateString('en-ET', {
                              day: 'numeric',
                              month: 'short',
                            })}
                            {isOverdue && ' ⚠️'}
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge text-xs capitalize ${
                            assignment.status === 'paid'
                              ? 'badge-success'
                              : assignment.status === 'partial'
                              ? 'badge-warning'
                              : assignment.status === 'overdue'
                              ? 'badge-danger'
                              : 'badge-gray'
                          }`}
                        >
                          {assignment.status}
                        </span>
                      </td>
                      <td className="text-right">
                        {assignment.status !== 'paid' && assignment.status !== 'cancelled' && (
                          <button
                            onClick={() => setPaymentModal({ open: true, assignment })}
                            className="btn-primary btn-sm"
                          >
                            💳 Collect
                          </button>
                        )}
                        {assignment.status === 'paid' && (
                          <span className="text-xs text-green-600 font-semibold">✓ Paid</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {pagination.from}–{pagination.to} of {pagination.total}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => updateParam('page', String(page - 1))}
                disabled={!pagination.hasPreviousPage}
                className="btn-outline btn-sm disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-sm px-2 py-1 text-slate-600">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => updateParam('page', String(page + 1))}
                disabled={!pagination.hasNextPage}
                className="btn-outline btn-sm disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {paymentModal.open && paymentModal.assignment && (
        <PaymentModal
          assignment={paymentModal.assignment}
          student={paymentModal.assignment.student}
          onClose={() => setPaymentModal({ open: false, assignment: null })}
          onSuccess={() => {
            setPaymentModal({ open: false, assignment: null });
            queryClient.invalidateQueries({ queryKey: ['fee-assignments'] });
            queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
          }}
        />
      )}
    </div>
  );
};

export default FeeCollectionPage;
