import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { useAuthStore } from '../../store/authStore';

const emptyDept = { name: '', code: '', description: '' };
const emptyDesig = { name: '', code: '', department: '', level: '1' };

const DepartmentsPage = () => {
  const qc = useQueryClient();
  const canEdit = ['super_admin', 'admin'].includes(useAuthStore((s) => s.user?.role));
  const [deptModal, setDeptModal] = useState({ open: false, item: null });
  const [desigModal, setDesigModal] = useState(false);
  const [d, setD] = useState(emptyDept);
  const [g, setG] = useState(emptyDesig);

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/hrm/departments')).data.data.departments,
  });
  const { data: designations = [] } = useQuery({
    queryKey: ['designations'],
    queryFn: async () => (await api.get('/hrm/designations')).data.data.designations,
  });

  const fail = (err) => toast.error(err.response?.data?.message || 'Request failed.');
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['departments'] });
    qc.invalidateQueries({ queryKey: ['designations'] });
  };

  const saveDept = useMutation({
    mutationFn: (p) =>
      deptModal.item
        ? api.patch(`/hrm/departments/${deptModal.item._id}`, p)
        : api.post('/hrm/departments', p),
    onSuccess: () => {
      toast.success('Department saved.');
      refresh();
      setDeptModal({ open: false, item: null });
    },
    onError: fail,
  });
  const removeDept = useMutation({
    mutationFn: (id) => api.delete(`/hrm/departments/${id}`),
    onSuccess: () => {
      toast.success('Department deactivated.');
      refresh();
    },
    onError: fail,
  });
  const saveDesig = useMutation({
    mutationFn: (p) => api.post('/hrm/designations', p),
    onSuccess: () => {
      toast.success('Designation saved.');
      refresh();
      setDesigModal(false);
    },
    onError: fail,
  });

  const openDept = (item) => {
    setD(
      item
        ? { name: item.name, code: item.code || '', description: item.description || '' }
        : emptyDept
    );
    setDeptModal({ open: true, item });
  };
  const openDesig = (deptId) => {
    setG({ ...emptyDesig, department: deptId });
    setDesigModal(true);
  };

  const submitDept = (e) => {
    e.preventDefault();
    if (!d.name.trim() || !d.code.trim()) {
      toast.error('Name and code are required.');
      return;
    }
    saveDept.mutate({
      name: d.name.trim(),
      code: d.code.trim().toUpperCase(),
      description: d.description || undefined,
    });
  };
  const submitDesig = (e) => {
    e.preventDefault();
    if (!g.name.trim() || !g.code.trim() || !g.department) {
      toast.error('Name, code and department are required.');
      return;
    }
    saveDesig.mutate({
      name: g.name.trim(),
      code: g.code.trim().toUpperCase(),
      department: g.department,
      level: parseInt(g.level, 10) || 1,
    });
  };

  const of = (deptId) => designations.filter((x) => (x.department?._id || x.department) === deptId);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">{departments.length} departments</p>
        </div>
        {canEdit && (
          <button type="button" className="btn-primary" onClick={() => openDept(null)}>
            Add Department
          </button>
        )}
      </div>

      {isLoading && <div className="card p-8 text-center text-slate-400">Loading...</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.map((x) => (
          <div key={x._id} className="card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">
                {x.name} <span className="badge badge-gray">{x.code}</span>
              </h3>
              {canEdit && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    onClick={() => openDesig(x._id)}
                  >
                    + Designation
                  </button>
                  <button type="button" className="btn-outline btn-sm" onClick={() => openDept(x)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-danger btn-sm"
                    onClick={() =>
                      window.confirm(`Deactivate ${x.name}?`) && removeDept.mutate(x._id)
                    }
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {of(x._id).length === 0 && (
                <span className="text-xs text-slate-400">No designations</span>
              )}
              {of(x._id).map((s) => (
                <span key={s._id} className="badge badge-primary">
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={deptModal.open}
        title={deptModal.item ? 'Edit Department' : 'Add Department'}
        onClose={() => setDeptModal({ open: false, item: null })}
      >
        <form onSubmit={submitDept}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              className="form-input"
              value={d.name}
              onChange={(e) => setD((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Code</label>
            <input
              className="form-input"
              value={d.code}
              onChange={(e) => setD((p) => ({ ...p, code: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={d.description}
              onChange={(e) => setD((p) => ({ ...p, description: e.target.value }))}
            />
          </div>
          <button type="submit" disabled={saveDept.isPending} className="btn-primary w-full">
            {saveDept.isPending ? 'Saving...' : 'Save'}
          </button>
        </form>
      </Modal>

      <Modal open={desigModal} title="Add Designation" onClose={() => setDesigModal(false)}>
        <form onSubmit={submitDesig}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              className="form-input"
              value={g.name}
              onChange={(e) => setG((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Code</label>
            <input
              className="form-input"
              value={g.code}
              onChange={(e) => setG((p) => ({ ...p, code: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Level</label>
            <input
              type="number"
              min="1"
              className="form-input"
              value={g.level}
              onChange={(e) => setG((p) => ({ ...p, level: e.target.value }))}
            />
          </div>
          <button type="submit" disabled={saveDesig.isPending} className="btn-primary w-full">
            {saveDesig.isPending ? 'Saving...' : 'Save'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default DepartmentsPage;
