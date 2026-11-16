import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { useAuthStore } from '../../store/authStore';

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const empty = { name: 'A', grade: '', class: '', academicYear: '', capacity: '50' };

const SectionsPage = () => {
  const qc = useQueryClient();
  const canEdit = ['super_admin', 'admin'].includes(useAuthStore((s) => s.user?.role));
  const [filter, setFilter] = useState('');
  const [modal, setModal] = useState({ open: false, item: null });
  const [f, setF] = useState(empty);

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['sections', filter],
    queryFn: async () =>
      (await api.get(`/academic/sections${filter ? `?grade=${filter}` : ''}`)).data.data.sections,
  });
  const { data: years = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => (await api.get('/academic/years')).data.data.academicYears,
  });
  const { data: classes = [] } = useQuery({
    queryKey: ['classes-by-grade', f.grade],
    queryFn: async () => (await api.get(`/academic/classes?grade=${f.grade}`)).data.data.classes,
    enabled: !!f.grade,
  });

  const done = (msg) => () => {
    toast.success(msg);
    qc.invalidateQueries({ queryKey: ['sections'] });
    setModal({ open: false, item: null });
  };
  const fail = (err) => toast.error(err.response?.data?.message || 'Request failed.');

  const save = useMutation({
    mutationFn: (p) =>
      modal.item
        ? api.patch(`/academic/sections/${modal.item._id}`, p)
        : api.post('/academic/sections', p),
    onSuccess: done('Saved.'),
    onError: fail,
  });
  const remove = useMutation({
    mutationFn: (id) => api.delete(`/academic/sections/${id}`),
    onSuccess: done('Deleted.'),
    onError: fail,
  });

  const openModal = (item) => {
    setF(
      item
        ? {
            name: item.name,
            grade: item.grade,
            class: item.class?._id || item.class || '',
            academicYear: item.academicYear?._id || item.academicYear || '',
            capacity: String(item.capacity || 50),
          }
        : empty
    );
    setModal({ open: true, item });
  };
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!f.grade || !f.class || !f.academicYear) {
      toast.error('Grade, class and academic year are required.');
      return;
    }
    save.mutate({
      name: f.name,
      class: f.class,
      grade: f.grade,
      academicYear: f.academicYear,
      capacity: parseInt(f.capacity, 10) || 50,
    });
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sections</h1>
          <p className="page-subtitle">{sections.length} sections</p>
        </div>
        <div className="flex gap-2">
          <select
            className="form-select w-36"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All grades</option>
            {GRADES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
          {canEdit && (
            <button type="button" className="btn-primary" onClick={() => openModal(null)}>
              Add Section
            </button>
          )}
        </div>
      </div>

      {isLoading && <div className="card p-8 text-center text-slate-400">Loading...</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => {
          const used = s.currentEnrollment || 0;
          const pct = s.capacity ? Math.min(100, Math.round((used / s.capacity) * 100)) : 0;
          return (
            <div key={s._id} className="card p-4">
              <h3 className="font-bold">
                {s.grade} · Section {s.name}
              </h3>
              <p className="text-xs text-slate-500">
                {used} / {s.capacity} students
              </p>
              <div className="h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full ${pct >= 90 ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {canEdit && (
                <div className="flex gap-2 mt-3">
                  <button type="button" className="btn-outline btn-sm" onClick={() => openModal(s)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-danger btn-sm"
                    onClick={() => window.confirm('Delete this section?') && remove.mutate(s._id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal
        open={modal.open}
        title={modal.item ? 'Edit Section' : 'Add Section'}
        onClose={() => setModal({ open: false, item: null })}
      >
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Grade</label>
            <select
              className="form-select"
              value={f.grade}
              onChange={(e) => setF((p) => ({ ...p, grade: e.target.value, class: '' }))}
            >
              <option value="">Select</option>
              {GRADES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Class</label>
            <select
              className="form-select"
              value={f.class}
              onChange={set('class')}
              disabled={!f.grade}
            >
              <option value="">Select</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Section name</label>
            <select className="form-select" value={f.name} onChange={set('name')}>
              {['A', 'B', 'C', 'D'].map((n) => (
                <option key={n}>{n}</option>
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

export default SectionsPage;
