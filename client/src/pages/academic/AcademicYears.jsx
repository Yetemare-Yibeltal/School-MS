// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// ACADEMIC YEARS PAGE
// kat-school/client/src/pages/academic/AcademicYearsPage.jsx
// ============================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Modal = ({ isOpen, title, children, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
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

const AcademicYearsPage = () => {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState({ open: false, type: null, data: null });
  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
  });
  const [errors, setErrors] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const res = await api.get('/academic/years');
      return res.data.data.academicYears;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/academic/years', data),
    onSuccess: () => {
      toast.success('Academic year created.');
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      setModal({ open: false, type: null, data: null });
      resetForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/academic/years/${id}`, data),
    onSuccess: () => {
      toast.success('Academic year updated.');
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      setModal({ open: false, type: null, data: null });
      resetForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const setCurrentMutation = useMutation({
    mutationFn: (id) => api.patch(`/academic/years/${id}`, { isCurrent: true }),
    onSuccess: () => {
      toast.success('Current academic year updated.');
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const resetForm = () => {
    setForm({ name: '', startDate: '', endDate: '', isCurrent: false, description: '' });
    setErrors({});
  };

  const openCreate = () => {
    resetForm();
    setModal({ open: true, type: 'create', data: null });
  };

  const openEdit = (year) => {
    setForm({
      name: year.name,
      startDate: new Date(year.startDate).toISOString().split('T')[0],
      endDate: new Date(year.endDate).toISOString().split('T')[0],
      isCurrent: year.isCurrent,
      description: year.description || '',
    });
    setModal({ open: true, type: 'edit', data: year });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required.';
    if (!form.startDate) newErrors.startDate = 'Start date is required.';
    if (!form.endDate) newErrors.endDate = 'End date is required.';
    if (form.startDate && form.endDate && form.endDate <= form.startDate) {
      newErrors.endDate = 'End date must be after start date.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      isCurrent: form.isCurrent,
      description: form.description || undefined,
    };

    if (modal.type === 'create') {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate({ id: modal.data._id, data: payload });
    }
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const years = data || [];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Academic Years</h1>
          <p className="page-subtitle">Manage school academic years and terms</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Academic Year
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-5 bg-slate-100 rounded w-32 mb-3" />
              <div className="h-4 bg-slate-100 rounded w-48" />
            </div>
          ))}
        </div>
      ) : years.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📅</div>
          <p className="text-slate-500 font-medium">No academic years found</p>
          <button onClick={openCreate} className="btn-primary mt-4">
            Create First Academic Year
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {years.map((year) => (
            <div
              key={year._id}
              className={`card p-5 transition-all ${
                year.isCurrent ? 'border-2 border-indigo-400 shadow-md' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{year.name}</h3>
                    {year.isCurrent && <span className="badge badge-primary text-xs">Current</span>}
                  </div>
                  <span
                    className={`badge text-xs mt-1 ${
                      year.status === 'active'
                        ? 'badge-success'
                        : year.status === 'completed'
                        ? 'badge-gray'
                        : 'badge-warning'
                    } capitalize`}
                  >
                    {year.status}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(year)} className="btn-icon btn-ghost">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">📅 Start:</span>
                  <span>
                    {new Date(year.startDate).toLocaleDateString('en-ET', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">🏁 End:</span>
                  <span>
                    {new Date(year.endDate).toLocaleDateString('en-ET', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {year.description && (
                  <p className="text-slate-400 text-xs mt-2">{year.description}</p>
                )}
              </div>

              {!year.isCurrent && year.status !== 'completed' && (
                <button
                  onClick={() => setCurrentMutation.mutate(year._id)}
                  disabled={setCurrentMutation.isPending}
                  className="btn-outline btn-sm w-full mt-4"
                >
                  {setCurrentMutation.isPending ? <div className="spinner-sm" /> : 'Set as Current'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modal.open}
        title={modal.type === 'create' ? 'Add Academic Year' : 'Edit Academic Year'}
        onClose={() => {
          setModal({ open: false, type: null, data: null });
          resetForm();
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g. 2017/2025 E.C."
              className={errors.name ? 'form-input-error' : 'form-input'}
            />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
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
            <div className="form-group">
              <label className="form-label">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => updateField('endDate', e.target.value)}
                className={errors.endDate ? 'form-input-error' : 'form-input'}
              />
              {errors.endDate && <p className="form-error">{errors.endDate}</p>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Optional description"
              className="form-textarea"
              rows={2}
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isCurrent}
              onChange={(e) => updateField('isCurrent', e.target.checked)}
              className="form-checkbox"
            />
            <span className="text-sm font-medium text-slate-700">Set as current academic year</span>
          </label>
          {form.isCurrent && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              ⚠️ Setting this as current will deactivate the previous current year.
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setModal({ open: false, type: null, data: null });
                resetForm();
              }}
              className="btn-outline flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn-primary flex-1"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <div className="spinner-sm" />
              ) : modal.type === 'create' ? (
                'Create'
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AcademicYearsPage;
