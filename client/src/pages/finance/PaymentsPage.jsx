// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// PAYMENTS PAGE
// kat-school/client/src/pages/finance/PaymentsPage.jsx
// ============================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Telebirr', 'CBE Birr', 'Cheque', 'Other'];
const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const PaymentsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [receiptModal, setReceiptModal] = useState({ open: false, payment: null });
  const [refundModal, setRefundModal] = useState({ open: false, payment: null });
  const [refundReason, setRefundReason] = useState('');

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const grade = searchParams.get('grade') || '';
  const method = searchParams.get('method') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    value ? next.set(key, value) : next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['payments', { page, search, grade, method, startDate, endDate }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(search && { search }),
        ...(grade && { grade }),
        ...(method && { method }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });
      const res = await api.get(`/finance/payments?${params}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  const refundMutation = useMutation({
    mutationFn: ({ id, reason }) => api.post(`/finance/payments/${id}/refund`, { reason }),
    onSuccess: () => {
      toast.success('Refund processed successfully.');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['fee-assignments'] });
      setRefundModal({ open: false, payment: null });
      setRefundReason('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Refund failed.'),
  });

  const payments = data?.data?.payments || [];
  const pagination = data?.pagination || {};
  const summary = data?.data?.summary || {};

  const canRefund = ['super_admin', 'admin', 'accountant'].includes(user?.role);

  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">
            {pagination.total
              ? `${pagination.total} payment record${pagination.total !== 1 ? 's' : ''}`
              : 'All fee payment transactions'}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: 'Total Collected',
              value: `ETB ${Number(summary.totalAmount || 0).toLocaleString()}`,
              color: 'bg-green-50 border-green-200 text-green-800',
            },
            {
              label: 'Cash',
              value: `ETB ${Number(summary.byMethod?.Cash || 0).toLocaleString()}`,
              color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
            },
            {
              label: 'Bank Transfer',
              value: `ETB ${Number(summary.byMethod?.['Bank Transfer'] || 0).toLocaleString()}`,
              color: 'bg-blue-50 border-blue-200 text-blue-700',
            },
            {
              label: 'Telebirr / Mobile',
              value: `ETB ${Number(
                (summary.byMethod?.Telebirr || 0) + (summary.byMethod?.['CBE Birr'] || 0)
              ).toLocaleString()}`,
              color: 'bg-purple-50 border-purple-200 text-purple-700',
            },
          ].map((stat) => (
            <div key={stat.label} className={`p-3 rounded-xl border ${stat.color}`}>
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs font-medium mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
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
              placeholder="Search by name, receipt #..."
              className="form-input pl-9"
            />
          </div>
          <div>
            <label className="form-label text-xs">Start</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => updateParam('startDate', e.target.value)}
              max={today}
              defaultValue={firstOfMonth}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label text-xs">End</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => updateParam('endDate', e.target.value)}
              max={today}
              min={startDate}
              className="form-input"
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
            value={method}
            onChange={(e) => updateParam('method', e.target.value)}
            className="form-select w-36"
          >
            <option value="">All Methods</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {(search || grade || method || startDate || endDate) && (
            <button onClick={() => setSearchParams({ page: '1' })} className="btn-ghost text-sm">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Payments Table */}
      <div className="card overflow-hidden">
        <div className="table-container rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Student</th>
                <th>Fee Type</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
                <th>Collected By</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
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
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="text-4xl mb-3">🧾</div>
                    <p className="text-slate-500">No payments found</p>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr
                    key={payment._id}
                    className={`hover:bg-slate-50 ${payment.isRefunded ? 'bg-red-50/20' : ''}`}
                  >
                    <td>
                      <span className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {payment.receiptNumber}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-700 font-semibold text-xs">
                          {payment.studentName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {payment.studentName}
                          </p>
                          <p className="text-xs text-slate-400">{payment.grade}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm text-slate-600">{payment.feeTypeName}</td>
                    <td>
                      <span
                        className={`text-sm font-bold ${
                          payment.isRefunded ? 'text-red-500 line-through' : 'text-green-700'
                        }`}
                      >
                        ETB {Number(payment.amount).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge text-xs ${
                          payment.method === 'Cash'
                            ? 'bg-green-100 text-green-700'
                            : payment.method === 'Bank Transfer'
                            ? 'bg-blue-100 text-blue-700'
                            : payment.method === 'Telebirr'
                            ? 'bg-purple-100 text-purple-700'
                            : 'badge-gray'
                        }`}
                      >
                        {payment.method}
                      </span>
                    </td>
                    <td className="text-xs text-slate-500">
                      {new Date(payment.paymentDate).toLocaleDateString('en-ET', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="text-xs text-slate-500">{payment.collectedByName}</td>
                    <td>
                      {payment.isRefunded ? (
                        <span className="badge badge-danger text-xs">Refunded</span>
                      ) : (
                        <span className="badge badge-success text-xs">Completed</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setReceiptModal({ open: true, payment })}
                          className="btn-icon btn-ghost"
                          title="View Receipt"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </button>
                        {canRefund && !payment.isRefunded && (
                          <button
                            onClick={() => setRefundModal({ open: true, payment })}
                            className="btn-icon text-slate-400 hover:text-red-500 hover:bg-red-50"
                            title="Process Refund"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
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

      {/* Receipt Modal */}
      {receiptModal.open && receiptModal.payment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setReceiptModal({ open: false, payment: null })}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-base font-bold">Payment Receipt</h3>
              <button
                onClick={() => setReceiptModal({ open: false, payment: null })}
                className="btn-icon btn-ghost"
              >
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
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 14l9-5-9-5-9 5 9 5z"
                    />
                  </svg>
                </div>
                <h4 className="font-bold text-slate-900">Kat Secondary School</h4>
                <p className="text-xs text-slate-500">Addis Ababa, Ethiopia</p>
              </div>

              <div className="space-y-2 text-sm border-t border-dashed border-slate-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt No.</span>
                  <span className="font-mono font-semibold">
                    {receiptModal.payment.receiptNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Student</span>
                  <span className="font-medium">{receiptModal.payment.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Grade</span>
                  <span>{receiptModal.payment.grade}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fee Type</span>
                  <span className="font-medium">{receiptModal.payment.feeTypeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Method</span>
                  <span>{receiptModal.payment.method}</span>
                </div>
                {receiptModal.payment.transactionReference && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reference</span>
                    <span className="font-mono text-xs">
                      {receiptModal.payment.transactionReference}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Date</span>
                  <span>
                    {new Date(receiptModal.payment.paymentDate).toLocaleDateString('en-ET', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Collected By</span>
                  <span>{receiptModal.payment.collectedByName}</span>
                </div>
                <div className="border-t border-dashed border-slate-200 pt-2 mt-2 flex justify-between text-base font-bold">
                  <span>Amount Paid</span>
                  <span className="text-green-700">
                    ETB {Number(receiptModal.payment.amount).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="text-center mt-4 text-xs text-slate-400">
                <p>Thank you for your payment!</p>
              </div>

              <button onClick={() => window.print()} className="btn-outline w-full mt-4">
                🖨️ Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundModal.open && refundModal.payment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => {
              setRefundModal({ open: false, payment: null });
              setRefundReason('');
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up">
            <div className="px-6 py-4 border-b">
              <h3 className="text-base font-bold text-red-700">Process Refund</h3>
            </div>
            <div className="p-6">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
                <p className="text-sm text-red-800">
                  Refund <strong>ETB {Number(refundModal.payment.amount).toLocaleString()}</strong>{' '}
                  to {refundModal.payment.studentName}?
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Receipt: {refundModal.payment.receiptNumber}
                </p>
              </div>
              <div className="form-group">
                <label className="form-label">
                  Reason for Refund <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Explain why this payment is being refunded..."
                  className="form-textarea"
                  rows={3}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setRefundModal({ open: false, payment: null });
                    setRefundReason('');
                  }}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!refundReason.trim()) {
                      toast.error('Reason is required.');
                      return;
                    }
                    refundMutation.mutate({ id: refundModal.payment._id, reason: refundReason });
                  }}
                  disabled={refundMutation.isPending}
                  className="btn-danger flex-1"
                >
                  {refundMutation.isPending ? <div className="spinner-sm" /> : 'Process Refund'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
