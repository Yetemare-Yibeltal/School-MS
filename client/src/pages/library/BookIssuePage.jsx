// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// BOOK ISSUE / RETURN PAGE
// kat-school/client/src/pages/library/BookIssuePage.jsx
// ============================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const IssueModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ memberId: '', bookId: '', dueDate: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [memberSearch, setMemberSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const defaultDue = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: membersData } = useQuery({
    queryKey: ['library-members-search', memberSearch],
    queryFn: async () => {
      const res = await api.get(`/library/members?search=${memberSearch}&status=active&limit=10`);
      return res.data.data.members;
    },
    enabled: memberSearch.length >= 2,
  });

  const { data: booksData } = useQuery({
    queryKey: ['books-available-search', bookSearch],
    queryFn: async () => {
      const res = await api.get(`/library/books?search=${bookSearch}&available=true&limit=10`);
      return res.data.data.books;
    },
    enabled: bookSearch.length >= 2,
  });

  const issueMutation = useMutation({
    mutationFn: (data) => api.post('/library/issues', data),
    onSuccess: () => {
      toast.success('Book issued successfully!');
      onSuccess();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Issue failed.'),
  });

  const validate = () => {
    const newErrors = {};
    if (!form.memberId) newErrors.memberId = 'Member is required.';
    if (!form.bookId) newErrors.bookId = 'Book is required.';
    if (!form.dueDate) newErrors.dueDate = 'Due date is required.';
    if (form.dueDate && form.dueDate <= today)
      newErrors.dueDate = 'Due date must be in the future.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    issueMutation.mutate({
      member: form.memberId,
      book: form.bookId,
      dueDate: form.dueDate,
      notes: form.notes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-base font-bold">Issue Book</h3>
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
          {/* Member Search */}
          <div className="form-group">
            <label className="form-label">
              Member <span className="text-red-500">*</span>
            </label>
            <input
              type="search"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search by name, ID, or membership number..."
              className="form-input mb-2"
            />
            {memberSearch.length >= 2 && (membersData || []).length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                {(membersData || []).map((m) => (
                  <button
                    key={m._id}
                    type="button"
                    onClick={() => {
                      setForm((p) => ({ ...p, memberId: m._id }));
                      setMemberSearch(`${m.memberName} (${m.membershipId})`);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors ${
                      form.memberId === m._id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                    }`}
                  >
                    <span className="font-medium">{m.memberName}</span>
                    <span className="text-xs text-slate-400 ml-2">
                      {m.membershipId} &bull; {m.memberType}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {errors.memberId && <p className="form-error">{errors.memberId}</p>}
          </div>

          {/* Book Search */}
          <div className="form-group">
            <label className="form-label">
              Book <span className="text-red-500">*</span>
            </label>
            <input
              type="search"
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
              placeholder="Search by title, author, ISBN..."
              className="form-input mb-2"
            />
            {bookSearch.length >= 2 && (booksData || []).length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                {(booksData || []).map((b) => (
                  <button
                    key={b._id}
                    type="button"
                    onClick={() => {
                      setForm((p) => ({ ...p, bookId: b._id }));
                      setBookSearch(`${b.title} (${b.availableCopies || 0} available)`);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors ${
                      form.bookId === b._id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                    }`}
                  >
                    <span className="font-medium">{b.title}</span>
                    <span className="text-xs text-slate-400 ml-2">
                      {b.author} &bull; {b.availableCopies || 0} copies
                    </span>
                  </button>
                ))}
              </div>
            )}
            {errors.bookId && <p className="form-error">{errors.bookId}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group mb-0">
              <label className="form-label">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.dueDate || defaultDue}
                onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                className={errors.dueDate ? 'form-input-error' : 'form-input'}
              />
              {errors.dueDate && <p className="form-error">{errors.dueDate}</p>}
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Optional"
                className="form-input"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">
              Cancel
            </button>
            <button type="submit" disabled={issueMutation.isPending} className="btn-primary flex-1">
              {issueMutation.isPending ? <div className="spinner-sm" /> : '📚 Issue Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BookIssuePage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [issueModal, setIssueModal] = useState(false);

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const overdue = searchParams.get('overdue') || '';

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    value ? next.set(key, value) : next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['book-issues', { page, search, status, overdue }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(search && { search }),
        ...(status && { status }),
        ...(overdue && { overdue }),
      });
      const res = await api.get(`/library/issues?${params}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  const returnMutation = useMutation({
    mutationFn: (id) => api.post(`/library/issues/${id}/return`),
    onSuccess: (res) => {
      const fine = res.data.data?.fineAmount;
      if (fine > 0) {
        toast.success(`Book returned! Fine: ETB ${fine}`);
      } else {
        toast.success('Book returned successfully!');
      }
      queryClient.invalidateQueries({ queryKey: ['book-issues'] });
      queryClient.invalidateQueries({ queryKey: ['library-dashboard'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Return failed.'),
  });

  const renewMutation = useMutation({
    mutationFn: ({ id, newDueDate }) => api.post(`/library/issues/${id}/renew`, { newDueDate }),
    onSuccess: () => {
      toast.success('Book renewed for another 14 days.');
      queryClient.invalidateQueries({ queryKey: ['book-issues'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Renewal failed.'),
  });

  const issues = data?.data?.issues || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Book Issues & Returns</h1>
          <p className="page-subtitle">
            {pagination.total
              ? `${pagination.total} issue record${pagination.total !== 1 ? 's' : ''}`
              : 'Manage book borrowing'}
          </p>
        </div>
        <button onClick={() => setIssueModal(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Issue Book
        </button>
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
              placeholder="Search by member, book title..."
              className="form-input pl-9"
            />
          </div>
          <select
            value={status}
            onChange={(e) => updateParam('status', e.target.value)}
            className="form-select w-32"
          >
            <option value="">All Status</option>
            <option value="issued">Issued</option>
            <option value="returned">Returned</option>
            <option value="overdue">Overdue</option>
          </select>
          <select
            value={overdue}
            onChange={(e) => updateParam('overdue', e.target.value)}
            className="form-select w-36"
          >
            <option value="">All Issues</option>
            <option value="true">Overdue Only</option>
          </select>
          {(search || status || overdue) && (
            <button onClick={() => setSearchParams({ page: '1' })} className="btn-ghost text-sm">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Issues Table */}
      <div className="card overflow-hidden">
        <div className="table-container rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Member</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Return Date</th>
                <th>Fine</th>
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
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="text-4xl mb-3">📚</div>
                    <p className="text-slate-500">No issue records found</p>
                    <button onClick={() => setIssueModal(true)} className="btn-primary mt-4">
                      Issue First Book
                    </button>
                  </td>
                </tr>
              ) : (
                issues.map((issue) => {
                  const isOverdue = !issue.returnDate && new Date(issue.dueDate) < new Date();
                  const newDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split('T')[0];
                  return (
                    <tr
                      key={issue._id}
                      className={`hover:bg-slate-50 ${isOverdue ? 'bg-red-50/20' : ''}`}
                    >
                      <td>
                        <p className="text-sm font-medium text-slate-900">{issue.bookTitle}</p>
                        {issue.bookAccessionNumber && (
                          <p className="text-xs text-slate-400">#{issue.bookAccessionNumber}</p>
                        )}
                      </td>
                      <td>
                        <p className="text-sm text-slate-700">{issue.memberName}</p>
                        <p className="text-xs text-slate-400 capitalize">{issue.memberType}</p>
                      </td>
                      <td className="text-xs text-slate-500">
                        {new Date(issue.issueDate).toLocaleDateString('en-ET', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td
                        className={`text-xs font-medium ${
                          isOverdue ? 'text-red-600' : 'text-slate-600'
                        }`}
                      >
                        {new Date(issue.dueDate).toLocaleDateString('en-ET', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {isOverdue && <span className="block text-xs text-red-500">OVERDUE</span>}
                      </td>
                      <td className="text-xs text-slate-500">
                        {issue.returnDate
                          ? new Date(issue.returnDate).toLocaleDateString('en-ET', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td>
                        {issue.fineAmount > 0 ? (
                          <span
                            className={`text-sm font-bold ${
                              issue.fineStatus === 'paid' ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            ETB {issue.fineAmount}
                            {issue.fineStatus === 'paid' && (
                              <span className="text-xs ml-1">(paid)</span>
                            )}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge text-xs ${
                            issue.status === 'returned'
                              ? 'badge-success'
                              : isOverdue
                              ? 'badge-danger'
                              : 'badge-primary'
                          }`}
                        >
                          {isOverdue ? 'Overdue' : issue.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {issue.status === 'issued' && (
                            <>
                              <button
                                onClick={() => {
                                  if (confirm('Return this book?'))
                                    returnMutation.mutate(issue._id);
                                }}
                                disabled={returnMutation.isPending}
                                className="btn-sm bg-green-50 text-green-700 border border-green-200 rounded-lg px-2 py-1 text-xs hover:bg-green-100"
                              >
                                Return
                              </button>
                              {!isOverdue && issue.renewalCount < 2 && (
                                <button
                                  onClick={() =>
                                    renewMutation.mutate({ id: issue._id, newDueDate })
                                  }
                                  disabled={renewMutation.isPending}
                                  className="btn-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-2 py-1 text-xs hover:bg-blue-100"
                                >
                                  Renew
                                </button>
                              )}
                            </>
                          )}
                        </div>
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

      {/* Issue Modal */}
      {issueModal && (
        <IssueModal
          onClose={() => setIssueModal(false)}
          onSuccess={() => {
            setIssueModal(false);
            queryClient.invalidateQueries({ queryKey: ['book-issues'] });
            queryClient.invalidateQueries({ queryKey: ['library-dashboard'] });
          }}
        />
      )}
    </div>
  );
};

export default BookIssuePage;
