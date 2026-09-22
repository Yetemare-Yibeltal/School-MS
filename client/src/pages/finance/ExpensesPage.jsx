// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// EXPENSES PAGE
// kat-school/client/src/pages/finance/ExpensesPage.jsx
// ============================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const EXPENSE_STATUSES = ['pending', 'approved', 'paid', 'rejected', 'cancelled'];

const Modal = ({ isOpen, title, children, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <h3 className="text-base font-bold">{title}</h3>
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
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const ExpensesPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [modal, setModal] = useState({ open: false, data: null });
  const [errors, setErrors] = useState({});

  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const page = parseInt(searchParams.get('page') || '1');
  const startDate = searchParams.get('startDate') || firstOfMonth;
  const endDate = searchParams.get('endDate') || today;
  const status = searchParams.get('status') || '';
  const category = searchParams.get('category') || '';

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    value ? next.set(key, value) : next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const initForm = () => ({
    title: '',
    category: '',
    amount: '',
    date: today,
    vendor: '',
    invoiceNumber: '',
    description: '',
    paymentMethod: 'Cash',
  });
  const [form, setForm] = useState(initForm());

  const { data: categoriesData } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const res = await api.get('/finance/expense-categories');
      return res.data.data.categories;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', { page, startDate, endDate, status, category }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(status && { status }),
        ...(category && { category }),
      });
      const res = await api.get(`/finance/expenses?${params}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/finance/expenses', data),
    onSuccess: () => {
      toast.success('Expense recorded.');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => api.patch(`/finance/expenses/${id}/approve`),
    onSuccess: () => {
      toast.success('Expense approved.');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const markPaidMutation = useMutation({
    mutationFn: (id) => api.patch(`/finance/expenses/${id}/mark-paid`),
    onSuccess: () => {
      toast.success('Expense marked as paid.');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const closeModal = () => {
    setModal({ open: false, data: null });
    setForm(initForm());
    setErrors({});
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required.';
    if (!form.category) newErrors.category = 'Category is required.';
    if (!form.amount || parseFloat(form.amount) <= 0)
      newErrors.amount = 'Valid amount is required.';
    if (!form.date) newErrors.date = 'Date is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    createMutation.mutate({
      title: form.title.trim(),
      category: form.category,
      amount: parseFloat(form.amount),
      date: form.date,
      vendor: form.vendor || undefined,
      invoiceNumber: form.invoiceNumber || undefined,
      paymentMethod: form.paymentMethod,
      description: form.description || undefined,
    });
  };

  const expenses = data?.data?.expenses || [];
  const pagination = data?.pagination || {};
  const summary = data?.data?.summary || {};
  const canApprove = ['super_admin', 'admin'].includes(user?.role);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Track and manage school expenditures</p>
        </div>
        <button
          onClick={() => {
            setForm(initForm());
            setModal({ open: true, data: null });
          }}
          className="btn-primary"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Record Expense
        </button>
      </div>

      {/* Summary */}
      {summary.total !== undefined && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: 'Total Expenses',
              value: `ETB ${Number(summary.total || 0).toLocaleString()}`,
              color: 'bg-red-50 border-red-200 text-red-800',
            },
            {
              label: 'Pending Approval',
              value: summary.pending || 0,
              color: 'bg-amber-50 border-amber-200 text-amber-700',
            },
            {
              label: 'Approved',
              value: summary.approved || 0,
              color: 'bg-blue-50 border-blue-200 text-blue-700',
            },
            {
              label: 'Paid',
              value: summary.paid || 0,
              color: 'bg-green-50 border-green-200 text-green-700',
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
          <div>
            <label className="form-label text-xs">Start</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => updateParam('startDate', e.target.value)}
              max={today}
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
          <div className="flex items-end">
            <select
              value={category}
              onChange={(e) => updateParam('category', e.target.value)}
              className="form-select w-40"
            >
              <option value="">All Categories</option>
              {(categoriesData || []).map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <select
              value={status}
              onChange={(e) => updateParam('status', e.target.value)}
              className="form-select w-32"
            >
              <option value="">All Status</option>
              {EXPENSE_STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
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
                <th>Recorded By</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j}>
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="text-4xl mb-3">📉</div>
                    <p className="text-slate-500">No expense records for this period</p>
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-slate-50">
                    <td>
                      <p className="text-sm font-medium text-slate-900">{expense.title}</p>
                      {expense.invoiceNumber && (
                        <p className="text-xs text-slate-400">Inv: {expense.invoiceNumber}</p>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-gray text-xs">{expense.categoryName}</span>
                    </td>
                    <td className="text-sm font-bold text-red-600">
                      ETB {Number(expense.amount).toLocaleString()}
                    </td>
                    <td className="text-sm text-slate-600">{expense.vendor || '—'}</td>
                    <td className="text-xs text-slate-500">
                      {new Date(expense.date).toLocaleDateString('en-ET', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="text-xs text-slate-500">{expense.recordedByName}</td>
                    <td>
                      <span
                        className={`badge text-xs capitalize ${
                          expense.status === 'paid'
                            ? 'badge-success'
                            : expense.status === 'approved'
                            ? 'badge-info'
                            : expense.status === 'pending'
                            ? 'badge-warning'
                            : expense.status === 'rejected'
                            ? 'badge-danger'
                            : 'badge-gray'
                        }`}
                      >
                        {expense.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canApprove && expense.status === 'pending' && (
                          <button
                            onClick={() => approveMutation.mutate(expense._id)}
                            disabled={approveMutation.isPending}
                            className="btn-sm bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg px-2 py-1 text-xs font-medium"
                          >
                            Approve
                          </button>
                        )}
                        {canApprove && expense.status === 'approved' && (
                          <button
                            onClick={() => markPaidMutation.mutate(expense._id)}
                            disabled={markPaidMutation.isPending}
                            className="btn-sm bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-lg px-2 py-1 text-xs font-medium"
                          >
                            Mark Paid
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

      {/* Modal */}
      <Modal isOpen={modal.open} title="Record Expense" onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="e.g. Electricity Bill — December"
              className={errors.title ? 'form-input-error' : 'form-input'}
              autoFocus
            />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group mb-0">
              <label className="form-label">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => updateField('category', e.target.value)}
                className={errors.category ? 'form-input-error' : 'form-select'}
              >
                <option value="">Select category</option>
                {(categoriesData || []).map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.category && <p className="form-error">{errors.category}</p>}
            </div>
            <div className="form-group mb-0">
              <label className="form-label">
                Amount (ETB) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => updateField('amount', e.target.value)}
                min="0.01"
                step="0.01"
                placeholder="0.00"
                className={errors.amount ? 'form-input-error' : 'form-input'}
              />
              {errors.amount && <p className="form-error">{errors.amount}</p>}
            </div>
            <div className="form-group mb-0">
              <label className="form-label">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => updateField('date', e.target.value)}
                max={today}
                className={errors.date ? 'form-input-error' : 'form-input'}
              />
              {errors.date && <p className="form-error">{errors.date}</p>}
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Payment Method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => updateField('paymentMethod', e.target.value)}
                className="form-select"
              >
                {['Cash', 'Bank Transfer', 'Cheque', 'Telebirr', 'Other'].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Vendor / Supplier</label>
              <input
                type="text"
                value={form.vendor}
                onChange={(e) => updateField('vendor', e.target.value)}
                placeholder="e.g. EEP, Water Authority"
                className="form-input"
              />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Invoice / Receipt #</label>
              <input
                type="text"
                value={form.invoiceNumber}
                onChange={(e) => updateField('invoiceNumber', e.target.value)}
                placeholder="Optional"
                className="form-input"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Optional details..."
              className="form-textarea"
              rows={2}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-outline flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary flex-1"
            >
              {createMutation.isPending ? <div className="spinner-sm" /> : '💾 Record Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExpensesPage;
