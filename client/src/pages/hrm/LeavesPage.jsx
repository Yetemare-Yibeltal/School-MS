// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// LEAVES PAGE
// kat-school/client/src/pages/hrm/LeavesPage.jsx
// ============================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

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

const LeavesPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [applyModal, setApplyModal] = useState(false);
  const [reviewModal, setReviewModal] = useState({ open: false, leave: null, action: null });
  const [errors, setErrors] = useState({});
  const [reviewComment, setReviewComment] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const page = parseInt(searchParams.get('page') || '1');
  const status = searchParams.get('status') || '';
  const staffType = searchParams.get('staffType') || '';

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    value ? next.set(key, value) : next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const initForm = () => ({
    staffId: '',
    staffType: 'teacher',
    leaveType: '',
    startDate: today,
    endDate: today,
    reason: '',
    emergencyContact: '',
  });
  const [form, setForm] = useState(initForm());

  const { data: leaveTypesData } = useQuery({
    queryKey: ['leave-types'],
    queryFn: async () => {
      const res = await api.get('/hrm/leave-types');
      return res.data.data.leaveTypes;
    },
  });

  const { data: teachersData } = useQuery({
    queryKey: ['teachers-for-leave'],
    queryFn: async () => {
      const res = await api.get('/teachers?status=active&limit=100');
      return res.data.data.teachers;
    },
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees-for-leave'],
    queryFn: async () => {
      const res = await api.get('/employees?status=active&limit=100');
      return res.data.data.employees;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['leaves', { page, status, staffType }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(status && { status }),
        ...(staffType && { staffType }),
      });
      const res = await api.get(`/hrm/leaves?${params}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  const applyMutation = useMutation({
    mutationFn: (data) => api.post('/hrm/leaves', data),
    onSuccess: () => {
      toast.success('Leave application submitted.');
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['hrm-dashboard'] });
      setApplyModal(false);
      setForm(initForm());
      setErrors({});
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, comment }) => api.patch(`/hrm/leaves/${id}/${action}`, { comment }),
    onSuccess: (_, { action }) => {
      toast.success(`Leave ${action === 'approve' ? 'approved' : 'rejected'}.`);
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['hrm-dashboard'] });
      setReviewModal({ open: false, leave: null, action: null });
      setReviewComment('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.staffId) newErrors.staffId = 'Staff member is required.';
    if (!form.leaveType) newErrors.leaveType = 'Leave type is required.';
    if (!form.startDate) newErrors.startDate = 'Start date is required.';
    if (!form.endDate) newErrors.endDate = 'End date is required.';
    if (form.endDate < form.startDate) newErrors.endDate = 'End date must be after start date.';
    if (!form.reason.trim()) newErrors.reason = 'Reason is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApply = (e) => {
    e.preventDefault();
    if (!validate()) return;
    applyMutation.mutate({
      staffId: form.staffId,
      staffType: form.staffType,
      leaveType: form.leaveType,
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason.trim(),
      emergencyContact: form.emergencyContact || undefined,
    });
  };

  const leaves = data?.data?.leaveApplications || [];
  const pagination = data?.pagination || {};
  const canApprove = ['super_admin', 'admin', 'hr_manager'].includes(user?.role);

  const staffOptions = form.staffType === 'teacher' ? teachersData || [] : employeesData || [];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">
            {pagination.total
              ? `${pagination.total} application${pagination.total !== 1 ? 's' : ''}`
              : 'Manage staff leave applications'}
          </p>
        </div>
        <button
          onClick={() => {
            setForm(initForm());
            setApplyModal(true);
          }}
          className="btn-primary"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Apply Leave
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(e) => updateParam('status', e.target.value)}
            className="form-select w-32"
          >
            <option value="">All Status</option>
            {['pending', 'approved', 'rejected', 'cancelled'].map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
          <select
            value={staffType}
            onChange={(e) => updateParam('staffType', e.target.value)}
            className="form-select w-32"
          >
            <option value="">All Staff</option>
            <option value="teacher">Teachers</option>
            <option value="employee">Employees</option>
          </select>
          {(status || staffType) && (
            <button onClick={() => setSearchParams({ page: '1' })} className="btn-ghost text-sm">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Leaves Table */}
      <div className="card overflow-hidden">
        <div className="table-container rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>App. #</th>
                <th>Staff</th>
                <th>Leave Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j}>
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="text-4xl mb-3">🏖️</div>
                    <p className="text-slate-500">No leave applications found</p>
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr
                    key={leave._id}
                    className={`hover:bg-slate-50 ${
                      leave.status === 'pending' ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    <td className="text-xs font-mono text-slate-500">{leave.applicationNumber}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-700 font-semibold text-xs">
                          {leave.staffName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{leave.staffName}</p>
                          <span
                            className={`text-xs ${
                              leave.staffType === 'teacher' ? 'text-purple-500' : 'text-teal-500'
                            }`}
                          >
                            {leave.staffType}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary text-xs">{leave.leaveTypeName}</span>
                    </td>
                    <td className="text-xs">
                      {new Date(leave.startDate).toLocaleDateString('en-ET', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td className="text-xs">
                      {new Date(leave.endDate).toLocaleDateString('en-ET', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td className="text-sm font-semibold">{leave.numberOfDays}</td>
                    <td className="text-xs text-slate-500 max-w-[150px] truncate">
                      {leave.reason}
                    </td>
                    <td>
                      <span
                        className={`badge text-xs capitalize ${
                          leave.status === 'approved'
                            ? 'badge-success'
                            : leave.status === 'rejected'
                            ? 'badge-danger'
                            : leave.status === 'pending'
                            ? 'badge-warning'
                            : 'badge-gray'
                        }`}
                      >
                        {leave.status}
                      </span>
                    </td>
                    <td className="text-right">
                      {canApprove && leave.status === 'pending' && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setReviewModal({ open: true, leave, action: 'approve' })}
                            className="btn-sm bg-green-50 text-green-700 border border-green-200 rounded-lg px-2 py-1 text-xs hover:bg-green-100"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => setReviewModal({ open: true, leave, action: 'reject' })}
                            className="btn-sm bg-red-50 text-red-700 border border-red-200 rounded-lg px-2 py-1 text-xs hover:bg-red-100"
                          >
                            ✗ Reject
                          </button>
                        </div>
                      )}
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

      {/* Apply Leave Modal */}
      <Modal
        isOpen={applyModal}
        title="Apply for Leave"
        onClose={() => {
          setApplyModal(false);
          setForm(initForm());
          setErrors({});
        }}
      >
        <form onSubmit={handleApply} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group mb-0">
              <label className="form-label">Staff Type</label>
              <select
                value={form.staffType}
                onChange={(e) => {
                  updateField('staffType', e.target.value);
                  updateField('staffId', '');
                }}
                className="form-select"
              >
                <option value="teacher">Teacher</option>
                <option value="employee">Employee</option>
              </select>
            </div>
            <div className="form-group mb-0">
              <label className="form-label">
                Staff Member <span className="text-red-500">*</span>
              </label>
              <select
                value={form.staffId}
                onChange={(e) => updateField('staffId', e.target.value)}
                className={errors.staffId ? 'form-input-error' : 'form-select'}
              >
                <option value="">Select staff</option>
                {staffOptions.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.firstName} {s.fatherName}
                  </option>
                ))}
              </select>
              {errors.staffId && <p className="form-error">{errors.staffId}</p>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">
              Leave Type <span className="text-red-500">*</span>
            </label>
            <select
              value={form.leaveType}
              onChange={(e) => updateField('leaveType', e.target.value)}
              className={errors.leaveType ? 'form-input-error' : 'form-select'}
            >
              <option value="">Select leave type</option>
              {(leaveTypesData || []).map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.maxDaysPerYear} days/year)
                </option>
              ))}
            </select>
            {errors.leaveType && <p className="form-error">{errors.leaveType}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group mb-0">
              <label className="form-label">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => updateField('startDate', e.target.value)}
                className={errors.startDate ? 'form-input-error' : 'form-input'}
              />
              {errors.startDate && <p className="form-error">{errors.startDate}</p>}
            </div>
            <div className="form-group mb-0">
              <label className="form-label">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => updateField('endDate', e.target.value)}
                min={form.startDate}
                className={errors.endDate ? 'form-input-error' : 'form-input'}
              />
              {errors.endDate && <p className="form-error">{errors.endDate}</p>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.reason}
              onChange={(e) => updateField('reason', e.target.value)}
              placeholder="Reason for leave..."
              className={errors.reason ? 'form-input-error' : 'form-textarea'}
              rows={3}
            />
            {errors.reason && <p className="form-error">{errors.reason}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Emergency Contact</label>
            <input
              type="text"
              value={form.emergencyContact}
              onChange={(e) => updateField('emergencyContact', e.target.value)}
              placeholder="Contact during leave (optional)"
              className="form-input"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setApplyModal(false);
                setForm(initForm());
                setErrors({});
              }}
              className="btn-outline flex-1"
            >
              Cancel
            </button>
            <button type="submit" disabled={applyMutation.isPending} className="btn-primary flex-1">
              {applyMutation.isPending ? <div className="spinner-sm" /> : '📋 Submit Application'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      {reviewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setReviewModal({ open: false, leave: null, action: null })}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up p-6">
            <h3
              className={`text-base font-bold mb-4 ${
                reviewModal.action === 'approve' ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {reviewModal.action === 'approve' ? '✓ Approve Leave' : '✗ Reject Leave'}
            </h3>
            <div className="p-3 bg-slate-50 rounded-xl mb-4 text-sm">
              <p>
                <strong>{reviewModal.leave?.staffName}</strong> — {reviewModal.leave?.leaveTypeName}
              </p>
              <p className="text-slate-500 text-xs mt-1">
                {new Date(reviewModal.leave?.startDate).toLocaleDateString('en-ET')} to{' '}
                {new Date(reviewModal.leave?.endDate).toLocaleDateString('en-ET')} (
                {reviewModal.leave?.numberOfDays} days)
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">
                {reviewModal.action === 'reject' ? 'Rejection Reason' : 'Comment (Optional)'}
                {reviewModal.action === 'reject' && <span className="text-red-500"> *</span>}
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={
                  reviewModal.action === 'approve'
                    ? 'Optional comment...'
                    : 'Reason for rejection...'
                }
                className="form-textarea"
                rows={3}
                autoFocus
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setReviewModal({ open: false, leave: null, action: null });
                  setReviewComment('');
                }}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (reviewModal.action === 'reject' && !reviewComment.trim()) {
                    toast.error('Rejection reason is required.');
                    return;
                  }
                  reviewMutation.mutate({
                    id: reviewModal.leave._id,
                    action: reviewModal.action,
                    comment: reviewComment,
                  });
                }}
                disabled={reviewMutation.isPending}
                className={`flex-1 ${
                  reviewModal.action === 'approve' ? 'btn-success' : 'btn-danger'
                }`}
              >
                {reviewMutation.isPending ? (
                  <div className="spinner-sm" />
                ) : reviewModal.action === 'approve' ? (
                  '✓ Approve'
                ) : (
                  '✗ Reject'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeavesPage;
