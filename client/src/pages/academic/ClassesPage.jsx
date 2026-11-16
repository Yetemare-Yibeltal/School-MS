import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { useAuthStore } from '../../store/authStore';

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const empty = { name: '', grade: '', academicYear: '', capacity: '150' };

const ClassesPage = () => {
  const qc = useQueryClient();
  const canEdit = ['super_admin', 'admin'].includes(useAuthStore((s) => s.user?.role));
  const [modal, setModal] = useState({ open: false, item: null });
  const [f, setF] = useState(empty);

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => (await api.get('/academic/classes')).data.data.classes,
  });
  const { data: years = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => (await api.get('/academic/years')).data.data.academicYears,
  });

  const done = (msg) => () => {
    toast.success(msg);
    qc.invalidateQueries({ queryKey: ['classes'] });
    setModal({ open: false, item: null });
  };
  const fail = (err) => toast.error(err.response?.data?.message || 'Request failed.');

  const save = useMutation({
    mutationFn: (p) =>
      modal.item
        ? api.patch(`/academic/classes/${modal.item._id}`, p)
        : api.post('/academic/classes', p),
    onSuccess: done('Saved.'),
    onError: fail,
  });
  const remove = useMutation({
    mutationFn: (id) => api.delete(`/academic/classes/${id}`),
    onSuccess: done('Deleted.'),
    onError: fail,
  });

  const openModal = (item) => {
    setF(
      item
        ? {
            name: item.name,
            grade: item.grade,
            academicYear: item.academicYear?._id || item.academicYear || '',
            capacity: String(item.capacity || 150),
          }
        : empty
    );
    setModal({ open: true, item });
  };
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!f.name.trim() || !f.grade || !f.academicYear) {
      toast.error('Name, grade and academic year are required.');
      return;
    }
    save.mutate({
      name: f.name.trim(),
      grade: f.grade,
      academicYear: f.academicYear,
      capacity: parseInt(f.capacity, 10) || 150,
    });
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Classes</h1>
          <p className="page-subtitle">{classes.length} classes</p>
        </div>
        {canEdit && (
          <button type="button" className="btn-primary" onClick={() => openModal(null)}>
            Add Class
          </button>
        )}
      </div>

      {isLoading && <div className="card p-8 text-center text-slate-400">Loading...</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((c) => (
          <div key={c._id} className="card p-4">
            <h3 className="font-bold">{c.name}</h3>
            <p className="text-xs text-slate-500">
              {c.grade} · {c.academicYear?.name || ''}
            </p>
            <p className="text-sm mt-2">Capacity: {c.capacity}</p>
            {canEdit && (
              <div className="flex gap-2 mt-3">
                <button type="button" className="btn-outline btn-sm" onClick={() => openModal(c)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="btn-danger btn-sm"
                  onClick={() => window.confirm(`Delete ${c.name}?`) && remove.mutate(c._id)}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        open={modal.open}
        title={modal.item ? 'Edit Class' : 'Add Class'}
        onClose={() => setModal({ open: false, item: null })}
      >
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              className="form-input"
              value={f.name}
              onChange={set('name')}
              placeholder="Grade 9"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Grade</label>
            <select className="form-select" value={f.grade} onChange={set('grade')}>
              <option value="">Select</option>
              {GRADES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Academic year</label>
            <select className="form-select" value={f.academicYear} onChange={set('academicYear')}>
              <option value="">Select</option>
              {years.map((y) => (
                <option key={y._id} value={y._id}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Capacity</label>
            <input
              type="number"
              min="1"
              className="form-input"
              value={f.capacity}
              onChange={set('capacity')}
            />
          </div>
          <button type="submit" disabled={save.isPending} className="btn-primary w-full">
            {save.isPending ? 'Saving...' : 'Save'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default ClassesPage;
