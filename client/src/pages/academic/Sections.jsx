// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// SECTIONS PAGE
// kat-school/client/src/pages/academic/SectionsPage.jsx
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

const SectionsPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [modal, setModal] = useState({ open: false, type: null, data: null });
  const [filterGrade, setFilterGrade] = useState('');
  const [errors, setErrors] = useState({});
  const canManage = ['super_admin', 'admin'].includes(user?.role);

  const initForm = () => ({
    name: '',
    class: '',
    grade: '',
    academicYear: '',
    classTeacher: '',
    capacity: '50',
    room: '',
  });
  const [form, setForm] = useState(initForm());

  const { data: sectionsData, isLoading } = useQuery({
    queryKey: ['sections', filterGrade],
    queryFn: async () => {
      const params = filterGrade ? `?grade=${filterGrade}` : '';
      const res = await api.get(`/academic/sections${params}`);
      return res.data.data.sections;
    },
  });

  const { data: classesData } = useQuery({
    queryKey: ['classes-for-section', form.grade],
    queryFn: async () => {
      const res = await api.get(`/academic/classes?grade=${form.grade}`);
      return res.data.data.classes;
    },
    enabled: !!form.grade,
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

  const { data: roomsData } = useQuery({
    queryKey: ['rooms-classrooms'],
    queryFn: async () => {
      const res = await api.get('/academic/rooms?type=Classroom&isActive=true');
      return res.data.data.rooms;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/academic/sections', data),
    onSuccess: () => {
      toast.success('Section created.');
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/academic/sections/${id}`, data),
    onSuccess: () => {
      toast.success('Section updated.');
      queryClient.invalidateQueries({ queryKey: ['sections'] });
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

  const openEdit = (section) => {
    setForm({
      name: section.name,
      class: section.class?._id || section.class || '',
      grade: section.grade,
      academicYear: section.academicYear?._id || section.academicYear || '',
      classTeacher: section.classTeacher?._id || section.classTeacher || '',
      capacity: String(section.capacity || 50),
      room: section.room?._id || section.room || '',
    });
    setModal({ open: true, type: 'edit', data: section });
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Section name is required.';
    if (!form.class) newErrors.class = 'Class is required.';
    if (!form.grade) newErrors.grade = 'Grade is required.';
    if (!form.academicYear) newErrors.academicYear = 'Academic year is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim().toUpperCase(),
      class: form.class,
      grade: form.grade,
      academicYear: form.academicYear,
      classTeacher: form.classTeacher || undefined,
      capacity: parseInt(form.capacity) || 50,
      room: form.room || undefined,
    };

    if (modal.type === 'create') {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate({ id: modal.data._id, data: payload });
    }
  };

  const sections = sectionsData || [];
  const grouped = GRADES.reduce((acc, g) => {
    acc[g] = sections.filter((s) => s.grade === g);
    return acc;
  }, {});

  const EnrollmentBar = ({ current, capacity }) => {
    const pct = capacity > 0 ? Math.round((current / capacity) * 100) : 0;
    return (
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{current} enrolled</span>
          <span>{capacity} capacity</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <p className="text-xs text-right text-slate-400 mt-0.5">{pct}% full</p>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sections</h1>
          <p className="page-subtitle">
            {sections.length} section{sections.length !== 1 ? 's' : ''} across all grades
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
            Add Section
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4">
              <div className="h-32 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : sections.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🚪</div>
          <p className="text-slate-500">No sections found</p>
          {canManage && (
            <button onClick={openCreate} className="btn-primary mt-4">
              Add First Section
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {GRADES.filter((g) => !filterGrade || g === filterGrade).map((grade) => {
            const gradeSections = grouped[grade] || [];
            if (gradeSections.length === 0) return null;
            return (
              <div key={grade}>
                <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <span className="badge badge-primary">{grade}</span>
                  <span className="text-slate-400">
                    — {gradeSections.length} section{gradeSections.length !== 1 ? 's' : ''}
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gradeSections
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((section) => (
                      <div key={section._id} className="card p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                                {section.name}
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-slate-900">
                                  Section {section.name}
                                </h3>
                                <p className="text-xs text-slate-500">{section.grade}</p>
                              </div>
                            </div>
                          </div>
                          {canManage && (
                            <button
                              onClick={() => openEdit(section)}
                              className="btn-icon btn-ghost"
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
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                          )}
                        </div>

                        <EnrollmentBar
                          current={section.currentEnrollment || 0}
                          capacity={section.capacity || 50}
                        />

                        <div className="mt-3 space-y-1 text-xs text-slate-500">
                          {section.classTeacherName && (
                            <div className="flex items-center gap-1">
                              <span>👨‍🏫</span>
                              <span>{section.classTeacherName}</span>
                            </div>
                          )}
                          {section.room?.name && (
                            <div className="flex items-center gap-1">
                              <span>🚪</span>
                              <span>{section.room.name}</span>
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
        title={modal.type === 'create' ? 'Add Section' : 'Edit Section'}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">
              Grade <span className="text-red-500">*</span>
            </label>
            <select
              value={form.grade}
              onChange={(e) => {
                updateField('grade', e.target.value);
                updateField('class', '');
              }}
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
              Class <span className="text-red-500">*</span>
            </label>
            <select
              value={form.class}
              onChange={(e) => updateField('class', e.target.value)}
              disabled={!form.grade}
              className={errors.class ? 'form-input-error' : 'form-select'}
            >
              <option value="">Select class</option>
              {(classesData || []).map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.class && <p className="form-error">{errors.class}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">
              Section Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value.toUpperCase())}
              placeholder="A, B, C..."
              maxLength={5}
              className={errors.name ? 'form-input-error' : 'form-input'}
              autoFocus
            />
            {errors.name && <p className="form-error">{errors.name}</p>}
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
              <option value="">No teacher assigned</option>
              {(teachersData || []).map((t) => (
                <option key={t._id} value={t._id}>
                  {t.firstName} {t.fatherName}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Room</label>
            <select
              value={form.room}
              onChange={(e) => updateField('room', e.target.value)}
              className="form-select"
            >
              <option value="">No room assigned</option>
              {(roomsData || []).map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name} ({r.code}) — {r.capacity} seats
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

export default SectionsPage;
