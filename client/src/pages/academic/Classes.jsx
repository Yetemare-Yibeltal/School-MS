// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// CLASSES PAGE
// kat-school/client/src/pages/academic/ClassesPage.jsx
// ============================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const Modal = ({ isOpen, title, children, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
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

const ClassesPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [modal, setModal] = useState({ open: false, type: null, data: null });
  const [filterGrade, setFilterGrade] = useState('');
  const [errors, setErrors] = useState({});
  const canManage = ['super_admin', 'admin'].includes(user?.role);

  const initForm = () => ({
    name: '',
    grade: '',
    academicYear: '',
    classTeacher: '',
    capacity: '50',
    description: '',
  });
  const [form, setForm] = useState(initForm());

  const { data: classesData, isLoading } = useQuery({
    queryKey: ['classes', filterGrade],
    queryFn: async () => {
      const params = filterGrade ? `?grade=${filterGrade}` : '';
      const res = await api.get(`/academic/classes${params}`);
      return res.data.data.classes;
    },
  });

  const { data: yearsData } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const res = await api.get('/academic/years');
      return res.data.data.academicYears;
    },
  });

  const { data: teachersData } = useQuery({
    queryKey: ['teachers-active'],
    queryFn: async () => {
      const res = await api.get('/teachers?status=active&limit=100');
      return res.data.data.teachers;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/academic/classes', data),
    onSuccess: () => {
      toast.success('Class created.');
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/academic/classes/${id}`, data),
    onSuccess: () => {
      toast.success('Class updated.');
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      closeModal();
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

  const openEdit = (cls) => {
    setForm({
      name: cls.name,
      grade: cls.grade,
      academicYear: cls.academicYear?._id || cls.academicYear || '',
      classTeacher: cls.classTeacher?._id || cls.classTeacher || '',
      capacity: String(cls.capacity || 50),
      description: cls.description || '',
    });
    setModal({ open: true, type: 'edit', data: cls });
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required.';
    if (!form.grade) newErrors.grade = 'Grade is required.';
    if (!form.academicYear) newErrors.academicYear = 'Academic year is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      grade: form.grade,
      academicYear: form.academicYear,
      classTeacher: form.classTeacher || undefined,
      capacity: parseInt(form.capacity) || 50,
      description: form.description || undefined,
    };

    if (modal.type === 'create') {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate({ id: modal.data._id, data: payload });
    }
  };

  const classes = classesData || [];
  const grouped = GRADES.reduce((acc, g) => {
    acc[g] = classes.filter((c) => c.grade === g);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Classes</h1>
          <p className="page-subtitle">
            {classes.length} class{classes.length !== 1 ? 'es' : ''} configured
          </p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Class
          </button>
        )}
      </div>

      {/* Grade Filter */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterGrade('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              !filterGrade
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
            }`}
          >
            All Grades
          </button>
          {GRADES.map((g) => (
            <button
              key={g}
              onClick={() => setFilterGrade(g)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                filterGrade === g
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4">
              <div className="h-32 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🏛️</div>
          <p className="text-slate-500">No classes found</p>
          {canManage && (
            <button onClick={openCreate} className="btn-primary mt-4">
              Add First Class
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {GRADES.filter((g) => !filterGrade || g === filterGrade).map((grade) => {
            const gradeClasses = grouped[grade] || [];
            if (gradeClasses.length === 0) return null;
            return (
              <div key={grade}>
                <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <span className="badge badge-primary">{grade}</span>
                  <span className="text-slate-400">
                    — {gradeClasses.length} class{gradeClasses.length !== 1 ? 'es' : ''}
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gradeClasses.map((cls) => (
                    <div key={cls._id} className="card p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{cls.name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {cls.academicYearName || cls.academicYear?.name}
                          </p>
                        </div>
                        {canManage && (
                          <button onClick={() => openEdit(cls)} className="btn-icon btn-ghost">
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Sections</span>
                          <span className="font-medium">{(cls.sections || []).length}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Capacity</span>
                          <span className="font-medium">{cls.capacity || 50} students</span>
                        </div>
                        {cls.classTeacherName && (
                          <div className="flex items-center justify-between text-slate-600">
                            <span>Class Teacher</span>
                            <span className="font-medium text-xs">{cls.classTeacherName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={modal.open}
        title={modal.type === 'create' ? 'Add Class' : 'Edit Class'}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">
              Class Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g. Grade 9"
              className={errors.name ? 'form-input-error' : 'form-input'}
              autoFocus
            />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">
              Grade <span className="text-red-500">*</span>
            </label>
            <select
              value={form.grade}
              onChange={(e) => updateField('grade', e.target.value)}
              className={errors.grade ? 'form-input-error' : 'form-select'}
            >
              <option value="">Select grade</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            {errors.grade && <p className="form-error">{errors.grade}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">
              Academic Year <span className="text-red-500">*</span>
            </label>
            <select
              value={form.academicYear}
              onChange={(e) => updateField('academicYear', e.target.value)}
              className={errors.academicYear ? 'form-input-error' : 'form-select'}
            >
              <option value="">Select year</option>
              {(yearsData || []).map((y) => (
                <option key={y._id} value={y._id}>
                  {y.name} {y.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </select>
            {errors.academicYear && <p className="form-error">{errors.academicYear}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Class Teacher</label>
            <select
              value={form.classTeacher}
              onChange={(e) => updateField('classTeacher', e.target.value)}
              className="form-select"
            >
              <option value="">No class teacher</option>
              {(teachersData || []).map((t) => (
                <option key={t._id} value={t._id}>
                  {t.firstName} {t.fatherName} — {t.primarySubject}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Capacity</label>
            <input
              type="number"
              value={form.capacity}
              onChange={(e) => updateField('capacity', e.target.value)}
              min="1"
              max="200"
              className="form-input"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-outline flex-1">
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
                'Save'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClassesPage;
