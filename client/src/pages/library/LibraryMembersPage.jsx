// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// LIBRARY MEMBERS PAGE
// kat-school/client/src/pages/library/LibraryMembersPage.jsx
// ============================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

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

const LibraryMembersPage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [modal, setModal] = useState({ open: false, type: null });
  const [errors, setErrors] = useState({});

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const memberType = searchParams.get('type') || '';
  const status = searchParams.get('status') || 'active';

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    value ? next.set(key, value) : next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const initForm = () => ({
    memberType: 'student',
    referenceId: '',
    maxBooksAllowed: '3',
    membershipExpiry: '',
  });
  const [form, setForm] = useState(initForm());

  const { data: studentsData } = useQuery({
    queryKey: ['students-for-member'],
    queryFn: async () => {
      const res = await api.get('/students?status=active&limit=200');
      return res.data.data.students;
    },
    enabled: form.memberType === 'student',
  });

  const { data: teachersData } = useQuery({
    queryKey: ['teachers-for-member'],
    queryFn: async () => {
      const res = await api.get('/teachers?status=active&limit=100');
      return res.data.data.teachers;
    },
    enabled: form.memberType === 'teacher',
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees-for-member'],
    queryFn: async () => {
      const res = await api.get('/employees?status=active&limit=100');
      return res.data.data.employees;
    },
    enabled: form.memberType === 'employee',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['library-members', { page, search, memberType, status }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(search && { search }),
        ...(memberType && { memberType }),
        ...(status && { status }),
      });
      const res = await api.get(`/library/members?${params}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  const registerMutation = useMutation({
    mutationFn: (data) => api.post('/library/members', data),
    onSuccess: () => {
      toast.success('Library member registered!');
      queryClient.invalidateQueries({ queryKey: ['library-members'] });
      queryClient.invalidateQueries({ queryKey: ['library-dashboard'] });
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => api.patch(`/library/members/${id}`, { status: 'inactive' }),
    onSuccess: () => {
      toast.success('Member deactivated.');
      queryClient.invalidateQueries({ queryKey: ['library-members'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const closeModal = () => {
    setModal({ open: false, type: null });
    setForm(initForm());
    setErrors({});
  };

  const updateField = (f, v) => {
    setForm((p) => ({ ...p, [f]: v }));
    if (errors[f]) setErrors((p) => ({ ...p, [f]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.referenceId) newErrors.referenceId = 'Please select a person.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const defaultExpiry = new Date();
    defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);

    registerMutation.mutate({
      memberType: form.memberType,
      referenceId: form.referenceId,
      maxBooksAllowed: parseInt(form.maxBooksAllowed) || 3,
      membershipExpiry: form.membershipExpiry || defaultExpiry.toISOString().split('T')[0],
    });
  };

  const members = data?.data?.members || [];
  const pagination = data?.pagination || {};

  const referenceOptions =
    form.memberType === 'student'
      ? studentsData || []
      : form.memberType === 'teacher'
      ? teachersData || []
      : employeesData || [];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Library Members</h1>
          <p className="page-subtitle">
            {pagination.total
              ? `${pagination.total} member${pagination.total !== 1 ? 's' : ''}`
              : 'Registered library members'}
          </p>
        </div>
        <button
          onClick={() => {
            setForm(initForm());
            setModal({ open: true, type: 'register' });
          }}
          className="btn-primary"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Register Member
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
              placeholder="Search by name or membership ID..."
              className="form-input pl-9"
            />
          </div>
          <select
            value={memberType}
            onChange={(e) => updateParam('type', e.target.value)}
            className="form-select w-32"
          >
            <option value="">All Types</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="employee">Employees</option>
          </select>
          <select
            value={status}
            onChange={(e) => updateParam('status', e.target.value)}
            className="form-select w-28"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="">All</option>
          </select>
          {(search || memberType) && (
            <button
              onClick={() => setSearchParams({ page: '1', status: 'active' })}
              className="btn-ghost text-sm"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Members Table */}
      <div className="card overflow-hidden">
        <div className="table-container rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Membership ID</th>
                <th>Type</th>
                <th>Books Borrowed</th>
                <th>Books Limit</th>
                <th>Expiry</th>
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
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="text-4xl mb-3">👥</div>
                    <p className="text-slate-500">No library members found</p>
                    <button
                      onClick={() => {
                        setForm(initForm());
                        setModal({ open: true, type: 'register' });
                      }}
                      className="btn-primary mt-4"
                    >
                      Register First Member
                    </button>
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const isExpiringSoon =
                    member.membershipExpiry &&
                    new Date(member.membershipExpiry) <
                      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                  return (
                    <tr key={member._id} className="hover:bg-slate-50">
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-indigo-700 font-semibold text-xs">
                            {member.memberName?.[0]}
                          </div>
                          <p className="text-sm font-medium text-slate-900">{member.memberName}</p>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {member.membershipId}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge text-xs capitalize ${
                            member.memberType === 'student'
                              ? 'badge-primary'
                              : member.memberType === 'teacher'
                              ? 'badge-info'
                              : 'badge-gray'
                          }`}
                        >
                          {member.memberType}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`text-sm font-semibold ${
                            member.currentBorrowedBooks >= member.maxBooksAllowed
                              ? 'text-red-600'
                              : 'text-slate-700'
                          }`}
                        >
                          {member.currentBorrowedBooks || 0}
                        </span>
                      </td>
                      <td className="text-sm text-slate-600">{member.maxBooksAllowed}</td>
                      <td>
                        {member.membershipExpiry ? (
                          <span
                            className={`text-xs ${
                              isExpiringSoon ? 'text-amber-600 font-semibold' : 'text-slate-500'
                            }`}
                          >
                            {new Date(member.membershipExpiry).toLocaleDateString('en-ET', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                            {isExpiringSoon && (
                              <span className="block text-xs text-amber-500">Expiring soon</span>
                            )}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge text-xs ${
                            member.status === 'active' ? 'badge-success' : 'badge-gray'
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="text-right">
                        {member.status === 'active' && (
                          <button
                            onClick={() => {
                              if (confirm('Deactivate this library member?'))
                                deactivateMutation.mutate(member._id);
                            }}
                            className="btn-icon text-slate-400 hover:text-red-500 hover:bg-red-50"
                            title="Deactivate"
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
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                              />
                            </svg>
                          </button>
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

      {/* Register Modal */}
      <Modal
        isOpen={modal.open && modal.type === 'register'}
        title="Register Library Member"
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Member Type</label>
            <div className="flex gap-2">
              {['student', 'teacher', 'employee'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    updateField('memberType', t);
                    updateField('referenceId', '');
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                    form.memberType === t
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Select Person <span className="text-red-500">*</span>
            </label>
            <select
              value={form.referenceId}
              onChange={(e) => updateField('referenceId', e.target.value)}
              className={errors.referenceId ? 'form-input-error' : 'form-select'}
            >
              <option value="">Select {form.memberType}</option>
              {referenceOptions.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.firstName} {p.fatherName}
                  {p.studentId
                    ? ` (${p.studentId})`
                    : p.teacherId
                    ? ` (${p.teacherId})`
                    : p.employeeId
                    ? ` (${p.employeeId})`
                    : ''}
                </option>
              ))}
            </select>
            {errors.referenceId && <p className="form-error">{errors.referenceId}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group mb-0">
              <label className="form-label">Max Books Allowed</label>
              <input
                type="number"
                value={form.maxBooksAllowed}
                onChange={(e) => updateField('maxBooksAllowed', e.target.value)}
                min="1"
                max="10"
                className="form-input"
              />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Membership Expiry</label>
              <input
                type="date"
                value={form.membershipExpiry}
                onChange={(e) => updateField('membershipExpiry', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="form-input"
              />
              <p className="form-hint">Default: 1 year from today</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-outline flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="btn-primary flex-1"
            >
              {registerMutation.isPending ? <div className="spinner-sm" /> : '👥 Register Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LibraryMembersPage;
