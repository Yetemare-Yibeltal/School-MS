// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// DEPARTMENTS PAGE
// kat-school/client/src/pages/hrm/DepartmentsPage.jsx
// ============================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

const DepartmentsPage = () => {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState({ open: false, type: null, data: null, subType: null });
  const [errors, setErrors] = useState({});

  const initDeptForm = () => ({ name: '', code: '', description: '', headOf: '' });
  const initDesigForm = () => ({ name: '', code: '', department: '', level: '1', description: '' });
  const [deptForm, setDeptForm] = useState(initDeptForm());
  const [desigForm, setDesigForm] = useState(initDesigForm());

  const { data: deptData, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/hrm/departments');
      return res.data.data.departments;
    },
  });

  const { data: designationsData } = useQuery({
    queryKey: ['designations-all'],
    queryFn: async () => {
      const res = await api.get('/hrm/designations');
      return res.data.data.designations;
    },
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees-active-list'],
    queryFn: async () => {
      const res = await api.get('/employees?status=active&limit=100');
      return res.data.data.employees;
    },
  });

  const createDeptMutation = useMutation({
    mutationFn: (data) => api.post('/hrm/departments', data),
    onSuccess: () => {
      toast.success('Department created.');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const updateDeptMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/hrm/departments/${id}`, data),
    onSuccess: () => {
      toast.success('Department updated.');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const createDesigMutation = useMutation({
    mutationFn: (data) => api.post('/hrm/designations', data),
    onSuccess: () => {
      toast.success('Designation created.');
      queryClient.invalidateQueries({ queryKey: ['designations-all'] });
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const closeModal = () => {
    setModal({ open: false, type: null, data: null, subType: null });
    setDeptForm(initDeptForm());
    setDesigForm(initDesigForm());
    setErrors({});
  };

  const openCreateDept = () => {
    setDeptForm(initDeptForm());
    setModal({ open: true, type: 'dept', subType: 'create', data: null });
  };
  const openEditDept = (dept) => {
    setDeptForm({
      name: dept.name,
      code: dept.code || '',
      description: dept.description || '',
      headOf: dept.headOf?._id || '',
    });
    setModal({ open: true, type: 'dept', subType: 'edit', data: dept });
  };
  const openCreateDesig = (deptId) => {
    setDesigForm({ ...initDesigForm(), department: deptId });
    setModal({ open: true, type: 'desig', subType: 'create', data: null });
  };

  const updateDeptField = (f, v) => {
    setDeptForm((p) => ({ ...p, [f]: v }));
    if (errors[f]) setErrors((p) => ({ ...p, [f]: null }));
  };
  const updateDesigField = (f, v) => {
    setDesigForm((p) => ({ ...p, [f]: v }));
    if (errors[f]) setErrors((p) => ({ ...p, [f]: null }));
  };

  const validateDept = () => {
    const newErrors = {};
    if (!deptForm.name.trim()) newErrors.name = 'Name is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateDesig = () => {
    const newErrors = {};
    if (!desigForm.name.trim()) newErrors.name = 'Name is required.';
    if (!desigForm.department) newErrors.department = 'Department is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDeptSubmit = (e) => {
    e.preventDefault();
    if (!validateDept()) return;
    const payload = {
      name: deptForm.name.trim(),
      code: deptForm.code.trim().toUpperCase() || undefined,
      description: deptForm.description || undefined,
      headOf: deptForm.headOf || undefined,
    };
    if (modal.subType === 'create') createDeptMutation.mutate(payload);
    else updateDeptMutation.mutate({ id: modal.data._id, data: payload });
  };

  const handleDesigSubmit = (e) => {
    e.preventDefault();
    if (!validateDesig()) return;
    createDesigMutation.mutate({
      name: desigForm.name.trim(),
      code: desigForm.code.trim().toUpperCase() || undefined,
      department: desigForm.department,
      level: parseInt(desigForm.level) || 1,
      description: desigForm.description || undefined,
    });
  };

  const departments = deptData || [];
  const designationsByDept = (deptId) =>
    (designationsData || []).filter((d) => (d.department?._id || d.department) === deptId);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Departments & Designations</h1>
          <p className="page-subtitle">
            {departments.length} department{departments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={openCreateDept} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Department
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4">
              <div className="h-40 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : departments.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🏢</div>
          <p className="text-slate-500">No departments configured</p>
          <button onClick={openCreateDept} className="btn-primary mt-4">
            Add First Department
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {departments.map((dept) => {
            const designations = designationsByDept(dept._id);
            return (
              <div key={dept._id} className="card">
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 font-bold text-sm">
                        {dept.code || dept.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{dept.name}</h3>
                        {dept.headOfName && (
                          <p className="text-xs text-slate-400">Head: {dept.headOfName}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openCreateDesig(dept._id)}
                        className="btn-outline btn-sm text-xs"
                      >
                        + Designation
                      </button>
                      <button onClick={() => openEditDept(dept)} className="btn-icon btn-ghost">
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
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    Designations ({designations.length})
                  </p>
                  {designations.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2 text-center">No designations yet</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {designations.map((desig) => (
                        <span
                          key={desig._id}
                          className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg border border-slate-200 font-medium"
                        >
                          {desig.name}
                          {desig.level > 1 && (
                            <span className="ml-1 text-slate-400">L{desig.level}</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Department Modal */}
      <Modal
        isOpen={modal.open && modal.type === 'dept'}
        title={modal.subType === 'create' ? 'Add Department' : 'Edit Department'}
        onClose={closeModal}
      >
        <form onSubmit={handleDeptSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={deptForm.name}
              onChange={(e) => updateDeptField('name', e.target.value)}
              placeholder="e.g. Administration"
              className={errors.name ? 'form-input-error' : 'form-input'}
              autoFocus
            />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Code</label>
            <input
              type="text"
              value={deptForm.code}
              onChange={(e) => updateDeptField('code', e.target.value.toUpperCase())}
              placeholder="ADM"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Head of Department</label>
            <select
              value={deptForm.headOf}
              onChange={(e) => updateDeptField('headOf', e.target.value)}
              className="form-select"
            >
              <option value="">Not assigned</option>
              {(employeesData || []).map((e) => (
                <option key={e._id} value={e._id}>
                  {e.firstName} {e.fatherName} — {e.designationName}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={deptForm.description}
              onChange={(e) => updateDeptField('description', e.target.value)}
              placeholder="Optional"
              className="form-textarea"
              rows={2}
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={closeModal} className="btn-outline flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createDeptMutation.isPending || updateDeptMutation.isPending}
              className="btn-primary flex-1"
            >
              {createDeptMutation.isPending || updateDeptMutation.isPending ? (
                <div className="spinner-sm" />
              ) : modal.subType === 'create' ? (
                'Create'
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Designation Modal */}
      <Modal
        isOpen={modal.open && modal.type === 'desig'}
        title="Add Designation"
        onClose={closeModal}
      >
        <form onSubmit={handleDesigSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">
              Designation Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={desigForm.name}
              onChange={(e) => updateDesigField('name', e.target.value)}
              placeholder="e.g. Senior Accountant"
              className={errors.name ? 'form-input-error' : 'form-input'}
              autoFocus
            />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group mb-0">
              <label className="form-label">Code</label>
              <input
                type="text"
                value={desigForm.code}
                onChange={(e) => updateDesigField('code', e.target.value.toUpperCase())}
                placeholder="SR-ACC"
                className="form-input"
              />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Level</label>
              <input
                type="number"
                value={desigForm.level}
                onChange={(e) => updateDesigField('level', e.target.value)}
                min="1"
                max="10"
                className="form-input"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              value={desigForm.department}
              onChange={(e) => updateDesigField('department', e.target.value)}
              className={errors.department ? 'form-input-error' : 'form-select'}
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
            {errors.department && <p className="form-error">{errors.department}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={desigForm.description}
              onChange={(e) => updateDesigField('description', e.target.value)}
              placeholder="Optional"
              className="form-textarea"
              rows={2}
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={closeModal} className="btn-outline flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createDesigMutation.isPending}
              className="btn-primary flex-1"
            >
              {createDesigMutation.isPending ? (
                <div className="spinner-sm" />
              ) : (
                'Create Designation'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DepartmentsPage;
