// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// INCOME PAGE
// kat-school/client/src/pages/finance/IncomePage.jsx
// ============================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const INCOME_SOURCES = [
  'Fee Collection',
  'Government Grant',
  'Donation',
  'Bank Interest',
  'Rental',
  'Event',
  'Other',
];

const Modal = ({ isOpen, title, children, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b">
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
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const IncomePage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [modal, setModal] = useState({ open: false, type: null, data: null });
  const [errors, setErrors] = useState({});

  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const page = parseInt(searchParams.get('page') || '1');
  const startDate = searchParams.get('startDate') || firstOfMonth;
  const endDate = searchParams.get('endDate') || today;
  const source = searchParams.get('source') || '';

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    value ? next.set(key, value) : next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const initForm = () => ({
    title: '',
    amount: '',
    source: 'Government Grant',
    date: today,
    referenceNumber: '',
    academicYear: '',
    term: '',
    description: '',
  });
  const [form, setForm] = useState(initForm());

  const { data: yearsData } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const res = await api.get('/academic/years');
      return res.data.data.academicYears;
    },
  });

  const { data: termsData } = useQuery({
    queryKey: ['terms', form.academicYear],
    queryFn: async () => {
      const res = await api.get(`/academic/terms?academicYear=${form.academicYear}`);
      return res.data.data.terms;
    },
    enabled: !!form.academicYear,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['income', { page, startDate, endDate, source }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(source && { source }),
      });
      const res = await api.get(`/finance/income?${params}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/finance/income', data),
    onSuccess: () => {
      toast.success('Income recorded.');
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/finance/income/${id}`),
    onSuccess: () => {
      toast.success('Income record deleted.');
      queryClient.invalidateQueries({ queryKey: ['income'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const closeModal = () => {
    setModal({ open: false, type: null, data: null });
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
    if (!form.amount || parseFloat(form.amount) <= 0)
      newErrors.amount = 'Valid amount is required.';
    if (!form.source) newErrors.source = 'Source is required.';
    if (!form.date) newErrors.date = 'Date is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    createMutation.mutate({
      title: form.title.trim(),
      amount: parseFloat(form.amount),
      source: form.source,
      date: form.date,
      referenceNumber: form.referenceNumber || undefined,
      academicYear: form.academicYear || undefined,
      term: form.term || undefined,
      description: form.description || undefined,
    });
  };

  const records = data?.data?.incomes || [];
  const pagination = data?.pagination || {};
  const summary = data?.data?.summary || {};

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Income Records</h1>
          <p className="page-subtitle">Non-fee income tracking</p>
        </div>
        <button
          onClick={() => {
            setForm(initForm());
            setModal({ open: true, type: 'create', data: null });
          }}
          className="btn-primary"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Record Income
        </button>
      </div>

      {/* Summary */}
      {summary.total !== undefined && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: 'Total Income',
              value: `ETB ${Number(summary.total || 0).toLocaleString()}`,
              color: 'bg-green-50 border-green-200 text-green-800',
            },
            {
              label: 'Records',
              value: summary.count || 0,
              color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
            },
            {
              label: 'Avg. Amount',
              value: `ETB ${Number(summary.average || 0).toLocaleString()}`,
              color: 'bg-blue-50 border-blue-200 text-blue-700',
            },
            {
              label: 'Top Source',
              value: summary.topSource || '—',
              color: 'bg-amber-50 border-amber-200 text-amber-700',
            },
          ].map((stat) => (
            <div key={stat.label} className={`p-3 rounded-xl border ${stat.color}`}>
              <p className="text-lg font-bold truncate">{stat.value}</p>
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
              value={source}
              onChange={(e) => updateParam('source', e.target.value)}
              className="form-select w-40"
            >
              <option value="">All Sources</option>
              {INCOME_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {source && (
            <div className="flex items-end">
              <button
                onClick={() => setSearchParams({ page: '1', startDate, endDate })}
                className="btn-ghost text-sm"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="table-container rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Source</th>
                <th>Amount</th>
                <th>Reference</th>
                <th>Date</th>
                <th>Recorded By</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j}>
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="text-4xl mb-3">📈</div>
                    <p className="text-slate-500">No income records for this period</p>
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50">
                    <td>
                      <p className="text-sm font-medium text-slate-900">{record.title}</p>
                      {record.description && (
                        <p className="text-xs text-slate-400 truncate max-w-[150px]">
                          {record.description}
                        </p>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-success text-xs">{record.source}</span>
                    </td>
                    <td className="text-sm font-bold text-green-700">
                      ETB {Number(record.amount).toLocaleString()}
                    </td>
                    <td className="text-xs font-mono text-slate-500">
                      {record.referenceNumber || '—'}
                    </td>
                    <td className="text-xs text-slate-500">
                      {new Date(record.date).toLocaleDateString('en-ET', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="text-xs text-slate-500">{record.recordedByName}</td>
                    <td className="text-right">
                      <button
                        onClick={() => {
                          if (confirm('Delete this income record?'))
                            deleteMutation.mutate(record._id);
                        }}
                        className="btn-icon text-slate-400 hover:text-red-500 hover:bg-red-50"
                        title="Delete"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
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
      <Modal isOpen={modal.open} title="Record Income" onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="e.g. Government Education Grant Q1"
              className={errors.title ? 'form-input-error' : 'form-input'}
              autoFocus
            />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
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
                Source <span className="text-red-500">*</span>
              </label>
              <select
                value={form.source}
                onChange={(e) => updateField('source', e.target.value)}
                className="form-select"
              >
                {INCOME_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
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
              <label className="form-label">Reference Number</label>
              <input
                type="text"
                value={form.referenceNumber}
                onChange={(e) => updateField('referenceNumber', e.target.value)}
                placeholder="Cheque / TXN ID"
                className="form-input"
              />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Academic Year</label>
              <select
                value={form.academicYear}
                onChange={(e) => {
                  updateField('academicYear', e.target.value);
                  updateField('term', '');
                }}
                className="form-select"
              >
                <option value="">Select (optional)</option>
                {(yearsData || []).map((y) => (
                  <option key={y._id} value={y._id}>
                    {y.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Term</label>
              <select
                value={form.term}
                onChange={(e) => updateField('term', e.target.value)}
                disabled={!form.academicYear}
                className="form-select"
              >
                <option value="">Select (optional)</option>
                {(termsData || []).map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Optional notes..."
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
              {createMutation.isPending ? <div className="spinner-sm" /> : '💾 Record Income'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default IncomePage;
