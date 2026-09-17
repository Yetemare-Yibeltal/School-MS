// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// SUBJECTS PAGE
// kat-school/client/src/pages/academic/SubjectsPage.jsx
// ============================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const CATEGORIES = ['Core', 'Elective', 'Languages', 'Sciences', 'Social Studies', 'Vocational', 'Arts', 'Sports'];

const Modal = ({ isOpen, title, children, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
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

const SubjectsPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [modal, setModal] = useState({ open: false, type: null, data: null });
  const [filterGrade, setFilterGrade] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [errors, setErrors] = useState({});

  const initForm = () => ({
    name: '', code: '', grades: [], category: 'Core',
    weeklyHours: '5', periodsPerWeek: '5', isCompulsory: true,
    fullMarks: '100', caMarks: '50', examMarks: '50',
    passingScore: '50', description: '',
  });

  const [form, setForm] = useState(initForm());
  const canManage = ['super_admin', 'admin'].includes(user?.role);

  const { data, isLoading } = useQuery({
    queryKey: ['subjects', { filterGrade, filterCategory }],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(filterGrade && { grade: filterGrade }),
        ...(filterCategory && { category: filterCategory }),
      });
      const res = await api.get(`/academic/subjects?${params}`);
      return res.data.data.subjects;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/academic/subjects', data),
    onSuccess: () => {
      toast.success('Subject created.');
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/academic/subjects/${id}`, data),
    onSuccess: () => {
      toast.success('Subject updated.');
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => api.delete(`/academic/subjects/${id}`),
    onSuccess: () => {
      toast.success('Subject deactivated.');
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const closeModal = () => {
    setModal({ open: false, type: null, data: null });
    setForm(initForm());
    setErrors({});
  };

  const openCreate = () => {
    setForm(initForm());
    setModal({ open: true, type: 'create', data: null });
  };

  const openEdit = (subject) => {
    setForm({
      name: subject.name,
      code: subject.code,
      grades: subject.grades || [],
      category: subject.category,
      weeklyHours: String(subject.weeklyHours || 5),
      periodsPerWeek: String(subject.periodsPerWeek || 5),
      isCompulsory: subject.isCompulsory !== false,
      fullMarks: String(subject.fullMarks || 100),
      caMarks: String(subject.caMarks || 50),
      exam
          examMarks: String(subject.examMarks || 50),
      passingScore: String(subject.passingScore || 50),
      description: subject.description || '',
    });
    setModal({ open: true, type: 'edit', data: subject });
  };

  const toggleGrade = (grade) => {
    setForm((prev) => ({
      ...prev,
      grades: prev.grades.includes(grade)
        ? prev.grades.filter((g) => g !== grade)
        : [...prev.grades, grade],
    }));
    if (errors.grades) setErrors((prev) => ({ ...prev, grades: null }));
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required.';
    if (!form.code.trim()) newErrors.code = 'Code is required.';
    if (form.grades.length === 0) newErrors.grades = 'Select at least one grade.';
    if (!form.category) newErrors.category = 'Category is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      grades: form.grades,
      category: form.category,
      weeklyHours: parseInt(form.weeklyHours) || 5,
      periodsPerWeek: parseInt(form.periodsPerWeek) || 5,
      isCompulsory: form.isCompulsory,
      fullMarks: parseInt(form.fullMarks) || 100,
      caMarks: parseInt(form.caMarks) || 50,
      examMarks: parseInt(form.examMarks) || 50,
      passingScore: parseInt(form.passingScore) || 50,
      description: form.description || undefined,
    };

    if (modal.type === 'create') {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate({ id: modal.data._id, data: payload });
    }
  };

  const subjects = data || [];

  const categoryColors = {
    Core: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Languages: 'bg-blue-50 text-blue-700 border-blue-200',
    Sciences: 'bg-green-50 text-green-700 border-green-200',
    'Social Studies': 'bg-amber-50 text-amber-700 border-amber-200',
    Elective: 'bg-purple-50 text-purple-700 border-purple-200',
    Vocational: 'bg-orange-50 text-orange-700 border-orange-200',
    Arts: 'bg-pink-50 text-pink-700 border-pink-200',
    Sports: 'bg-teal-50 text-teal-700 border-teal-200',
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subjects</h1>
          <p className="page-subtitle">{subjects.length} subject{subjects.length !== 1 ? 's' : ''} in the curriculum</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Subject
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className="form-select w-32">
            <option value="">All Grades</option>
            {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="form-select w-36">
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {(filterGrade || filterCategory) && (
            <button onClick={() => { setFilterGrade(''); setFilterCategory(''); }} className="btn-ghost text-sm">Clear</button>
          )}
        </div>
      </div>

      {/* Subjects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-5 bg-slate-100 rounded w-32 mb-2" />
              <div className="h-4 bg-slate-100 rounded w-24 mb-4" />
              <div className="flex gap-1">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-5 bg-slate-100 rounded w-12" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📖</div>
          <p className="text-slate-500">No subjects found</p>
          {canManage && <button onClick={openCreate} className="btn-primary mt-4">Add First Subject</button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <div key={subject._id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{subject.name}</h3>
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {subject.code}
                    </span>
                  </div>
                  <span className={`badge text-xs mt-1 border ${categoryColors[subject.category] || 'badge-gray'}`}>
                    {subject.category}
                  </span>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(subject)} className="btn-icon btn-ghost">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Deactivate ${subject.name}?`)) deactivateMutation.mutate(subject._id);
                      }}
                      className="btn-icon text-slate-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Grades */}
              <div className="flex flex-wrap gap-1 mb-3">
                {(subject.grades || []).map((g) => (
                  <span key={g} className="badge badge-gray text-xs">{g.replace('Grade ', 'G')}</span>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                <div>
                  <p className="text-sm font-bold text-slate-900">{subject.periodsPerWeek || 5}</p>
                  <p className="text-xs text-slate-400">Periods/wk</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{subject.fullMarks || 100}</p>
                  <p className="text-xs text-slate-400">Full Marks</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{subject.passingScore || 50}</p>
                  <p className="text-xs text-slate-400">Pass Mark</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                {subject.isCompulsory && (
                  <span className="badge badge-warning text-xs">Compulsory</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modal.open}
        title={modal.type === 'create' ? 'Add Subject' : 'Edit Subject'}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group col-span-2">
              <label className="form-label">Subject Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g. Mathematics" className={errors.name ? 'form-input-error' : 'form-input'} autoFocus />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Code <span className="text-red-500">*</span></label>
              <input type="text" value={form.code} onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                placeholder="MATH" className={errors.code ? 'form-input-error' : 'form-input'} />
              {errors.code && <p className="form-error">{errors.code}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Category <span className="text-red-500">*</span></label>
              <select value={form.category} onChange={(e) => updateField('category', e.target.value)} className="form-select">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Grades <span className="text-red-500">*</span></label>
            <div className="flex gap-2 flex-wrap mt-1">
              {GRADES.map((g) => (
                <button key={g} type="button" onClick={() => toggleGrade(g)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    form.grades.includes(g)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
                  }`}>
                  {g}
                </button>
              ))}
            </div>
            {errors.grades && <p className="form-error mt-1">{errors.grades}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Periods per Week</label>
              <input type="number" value={form.periodsPerWeek} onChange={(e) => updateField('periodsPerWeek', e.target.value)}
                min="1" max="40" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Full Marks</label>
              <input type="number" value={form.fullMarks} onChange={(e) => updateField('fullMarks', e.target.value)}
                min="0" max="200" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">CA Marks</label>
              <input type="number" value={form.caMarks} onChange={(e) => updateField('caMarks', e.target.value)}
                min="0" max="200" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Exam Marks</label>
              <input type="number" value={form.examMarks} onChange={(e) => updateField('examMarks', e.target.value)}
                min="0" max="200" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Passing Score</label>
              <input type="number" value={form.passingScore} onChange={(e) => updateField('passingScore', e.target.value)}
                min="0" max="100" className="form-input" />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isCompulsory} onChange={(e) => updateField('isCompulsory', e.target.checked)} className="form-checkbox" />
            <span className="text-sm font-medium text-slate-700">Compulsory subject</span>
          </label>

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
                : modal.type === 'create' ? 'Create Subject' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SubjectsPage;