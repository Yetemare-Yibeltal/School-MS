// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// FEE TYPES PAGE
// kat-school/client/src/pages/finance/FeeTypesPage.jsx
// ============================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const CATEGORIES = ['Tuition', 'Registration', 'Exam', 'Library', 'Sport', 'Transport', 'Medical', 'Uniform', 'Activity', 'Boarding', 'Other'];
const FREQUENCIES = ['one_time', 'per_term', 'per_year', 'monthly'];

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const FeeTypesPage = () => {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState({ open: false, type: null, data: null });
  const [errors, setErrors] = useState({});
  const [filterCategory, setFilterCategory] = useState('');

  const initForm = () => ({
    name: '', code: '', category: 'Tuition', amount: '',
    frequency: 'per_year', applicableGrades: [...GRADES],
    isMandatory: true, isRefundable: false,
    lateFineEnabled: false, lateFinePerDay: '0', gracePeriodDays: '0',
    description: '', color: '#4f46e5',
  });
  const [form, setForm] = useState(initForm());

  const { data, isLoading } = useQuery({
    queryKey: ['fee-types', filterCategory],
    queryFn: async () => {
      const params = filterCategory ? `?category=${filterCategory}` : '';
      const res = await api.get(`/finance/fee-types${params}`);
      return res.data.data.feeTypes;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/finance/fee-types', data),
    onSuccess: () => {
      toast.success('Fee type created.');
      queryClient.invalidateQueries({ queryKey: ['fee-types'] });
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/finance/fee-types/${id}`, data),
    onSuccess: () => {
      toast.success('Fee type updated.');
      queryClient.invalidateQueries({ queryKey: ['fee-types'] });
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => api.delete(`/finance/fee-types/${id}`),
    onSuccess: () => {
      toast.success('Fee type deactivated.');
      queryClient.invalidateQueries({ queryKey: ['fee-types'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const closeModal = () => {
    setModal({ open: false, type: null, data: null });
    setForm(initForm());
    setErrors({});
  };

  const openCreate = () => { setForm(initForm()); setModal({ open: true, type: 'create', data: null }); };

  const openEdit = (ft) => {
    setForm({
      name: ft.name, code: ft.code, category: ft.category,
      amount: String(ft.amount), frequency: ft.frequency,
      applicableGrades: ft.applicableGrades || [...GRADES],
      isMandatory: ft.isMandatory !== false, isRefundable: ft.isRefundable || false,
      lateFineEnabled: ft.lateFineEnabled || false,
      lateFinePerDay: String(ft.lateFinePerDay || 0),
      gracePeriodDays: String(ft.gracePeriodDays || 0),
      description: ft.description || '', color: ft.color || '#4f46e5',
    });
    setModal({ open: true, type: 'edit', data: ft });
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const toggleGrade = (grade) => {
    setForm((prev) => ({
      ...prev,
      applicableGrades: prev.applicableGrades.includes(grade)
        ? prev.applicableGrades.filter((g) => g !== grade)
        : [...prev.applicableGrades, grade],
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required.';
    if (!form.code.trim()) newErrors.code = 'Code is required.';
    if (!form.category) newErrors.category = 'Category is required.';
    if (!form.amount || parseFloat(form.amount) < 0) newErrors.amount = 'Valid amount is required.';
    if (form.applicableGrades.length === 0) newErrors.applicableGrades = 'Select at least one grade.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      category: form.category,
      amount: parseFloat(form.amount),
      frequency: form.frequency,
      applicableGrades: form.applicableGrades,
      isMandatory: form.isMandatory,
      isRefundable: form.isRefundable,
      lateFineEnabled: form.lateFineEnabled,
      lateFinePerDay: parseFloat(form.lateFinePerDay) || 0,
      gracePeriodDays: parseInt(form.gracePeriodDays) || 0,
      description: form.description || undefined,
      color: form.color,
    };

    if (modal.type === 'create') createMutation.mutate(payload);
    else updateMutation.mutate({ id: modal.data._id, data: payload });
  };

  const feeTypes = data || [];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fee Types</h1>
          <p className="page-subtitle">{feeTypes.length} active fee type{feeTypes.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Fee Type
        </button>
      </div>

      {/* Category Filter */}
      <div className="card p-3">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterCategory('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${!filterCategory ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300'}`}>
            All
          </button>
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setFilterCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filterCategory === c ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Fee Types Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4"><div className="h-32 bg-slate-100 rounded" /></div>
          ))}
        </div>
      ) : feeTypes.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">💳</div>
          <p className="text-slate-500">No fee types found</p>
          <button onClick={openCreate} className="btn-primary mt-4">Add First Fee Type</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {feeTypes.map((ft) => (
            <div key={ft._id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: ft.color || '#4f46e5' }}>
                    {ft.code.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{ft.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="badge badge-gray text-xs">{ft.code}</span>
                      <span className="badge badge-primary text-xs">{ft.category}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(ft)} className="btn-icon btn-ghost">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => { if (confirm(`Deactivate ${ft.name}?`)) deactivateMutation.mutate(ft._id); }}
                    className="btn-icon text-slate-400 hover:text-red-500 hover:bg-red-50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-black text-slate-900">
                    ETB {Number(ft.amount).toLocaleString()}
                  </span>
                  <span className="badge badge-gray text-xs capitalize">{ft.frequency.replace('_', ' ')}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(ft.applicableGrades || []).map((g) => (
                    <span key={g} className="badge badge-gray text-xs">{g.replace('Grade ', 'G')}</span>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  {ft.isMandatory && <span className="badge badge-warning text-xs">Mandatory</span>}
                  {ft.lateFineEnabled && <span className="badge badge-danger text-xs">Late Fine: ETB {ft.lateFinePerDay}/day</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modal.open} title={modal.type === 'create' ? 'Add Fee Type' : 'Edit Fee Type'} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group col-span-2">
              <label className="form-label">Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g. Annual Tuition Fee" className={errors.name ? 'form-input-error' : 'form-input'} autoFocus />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Code <span className="text-red-500">*</span></label>
              <input type="text" value={form.code} onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                placeholder="TUT" className={errors.code ? 'form-input-error' : 'form-input'} />
              {errors.code && <p className="form-error">{errors.code}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={(e) => updateField('color', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300" />
                <span className="text-xs text-slate-500">{form.color}</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Category <span className="text-red-500">*</span></label>
              <select value={form.category} onChange={(e) => updateField('category', e.target.value)} className="form-select">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (ETB) <span className="text-red-500">*</span></label>
              <input type="number" value={form.amount} onChange={(e) => updateField('amount', e.target.value)}
                min="0" step="0.01" className={errors.amount ? 'form-input-error' : 'form-input'} />
              {errors.amount && <p className="form-error">{errors.amount}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Frequency</label>
              <select value={form.frequency} onChange={(e) => updateField('frequency', e.target.value)} className="form-select">
                {FREQUENCIES.map((f) => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Applicable Grades <span className="text-red-500">*</span></label>
            <div className="flex gap-2 flex-wrap mt-1">
              {GRADES.map((g) => (
                <button key={g} type="button" onClick={() => toggleGrade(g)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    form.applicableGrades.includes(g)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
                  }`}>
                  {g}
                </button>
              ))}
            </div>
            {errors.applicableGrades && <p className="form-error mt-1">{errors.applicableGrades}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isMandatory} onChange={(e) => updateField('isMandatory',               e.target.checked)} className="form-checkbox" />
              <span className="text-sm text-slate-700">Mandatory fee</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isRefundable} onChange={(e) => updateField('isRefundable', e.target.checked)} className="form-checkbox" />
              <span className="text-sm text-slate-700">Refundable</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer col-span-2">
              <input type="checkbox" checked={form.lateFineEnabled} onChange={(e) => updateField('lateFineEnabled', e.target.checked)} className="form-checkbox" />
              <span className="text-sm text-slate-700">Enable late payment fine</span>
            </label>
          </div>

          {form.lateFineEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group mb-0">
                <label className="form-label">Late Fine per Day (ETB)</label>
                <input type="number" value={form.lateFinePerDay} onChange={(e) => updateField('lateFinePerDay', e.target.value)}
                  min="0" step="0.5" className="form-input" />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Grace Period (Days)</label>
                <input type="number" value={form.gracePeriodDays} onChange={(e) => updateField('gracePeriodDays', e.target.value)}
                  min="0" max="90" className="form-input" />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)}
              placeholder="Optional" className="form-textarea" rows={2} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary flex-1">
              {(createMutation.isPending || updateMutation.isPending)
                ? <div className="spinner-sm" />
                : modal.type === 'create' ? 'Create Fee Type' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FeeTypesPage;