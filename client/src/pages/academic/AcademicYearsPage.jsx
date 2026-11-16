import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/common/Modal';

const empty = { name: '', ethiopianYear: '', startDate: '', endDate: '', description: '' };
const day = (d) => (d ? new Date(d).toISOString().split('T')[0] : '');

const AcademicYearsPage = () => {
  const qc = useQueryClient();
  const [modal, setModal] = useState({ open: false, item: null });
  const [f, setF] = useState(empty);

  const { data: years = [], isLoading } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => (await api.get('/academic/years')).data.data.academicYears,
  });

  const done = (msg) => () => {
    toast.success(msg);
    qc.invalidateQueries({ queryKey: ['academic-years'] });
    setModal({ open: false, item: null });
  };
  const fail = (err) => toast.error(err.response?.data?.message || 'Request failed.');

  const save = useMutation({
    mutationFn: (p) =>
      modal.item
        ? api.patch(`/academic/years/${modal.item._id}`, p)
        : api.post('/academic/years', p),
    onSuccess: done('Saved.'),
    onError: fail,
  });
  const makeCurrent = useMutation({
    mutationFn: (id) => api.patch(`/academic/years/${id}`, { isCurrent: true }),
    onSuccess: done('Current year updated.'),
    onError: fail,
  });
  const remove = useMutation({
    mutationFn: (id) => api.delete(`/academic/years/${id}`),
    onSuccess: done('Deleted.'),
    onError: fail,
  });

  const openModal = (item) => {
    setF(
      item
        ? {
            name: item.name,
            ethiopianYear: item.ethiopianYear || '',
            startDate: day(item.startDate),
            endDate: day(item.endDate),
            description: item.description || '',
          }
        : empty
    );
    setModal({ open: true, item });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!f.name.trim() || !f.startDate || !f.endDate) {
      toast.error('Name, start and end date are required.');
      return;
    }
    if (f.endDate <= f.startDate) {
      toast.error('End date must be after start date.');
      return;
    }
    save.mutate({
      name: f.name.trim(),
      startDate: f.startDate,
      endDate: f.endDate,
      ethiopianYear: f.ethiopianYear ? parseInt(f.ethiopianYear, 10) : undefined,
      description: f.description || undefined,
    });
  };

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Academic Years</h1>
          <p className="page-subtitle">{years.length} years</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => openModal(null)}>
          Add Academic Year
        </button>
      </div>

      {isLoading && <div className="card p-8 text-center text-slate-400">Loading...</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {years.map((y) => (
          <div
            key={y._id}
            className={`card p-5 ${y.isCurrent ? 'border-2 border-indigo-400' : ''}`}
          >
            <div className="flex items-center gap-2">
              <h3 className="font-bold">{y.name}</h3>
              {y.isCurrent && <span className="badge badge-primary">Current</span>}
            </div>
            <p className="text-sm text-slate-500 mt-2">
              {new Date(y.startDate).toLocaleDateString('en-GB')} to{' '}
              {new Date(y.endDate).toLocaleDateString('en-GB')}
            </p>
            <div className="flex gap-2 mt-4 flex-wrap">
              <button type="button" className="btn-outline btn-sm" onClick={() => openModal(y)}>
                Edit
              </button>
              {!y.isCurrent && (
                <button
                  type="button"
                  className="btn-outline btn-sm"
                  onClick={() => makeCurrent.mutate(y._id)}
                >
                  Set current
                </button>
              )}
              {!y.isCurrent && (
                <button
                  type="button"
                  className="btn-danger btn-sm"
                  onClick={() => window.confirm(`Delete ${y.name}?`) && remove.mutate(y._id)}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={modal.open}
        title={modal.item ? 'Edit Academic Year' : 'Add Academic Year'}
        onClose={() => setModal({ open: false, item: null })}
      >
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              className="form-input"
              value={f.name}
              onChange={set('name')}
              placeholder="2019 E.C. (2026/2027)"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Ethiopian year</label>
            <input
              type="number"
              className="form-input"
              value={f.ethiopianYear}
              onChange={set('ethiopianYear')}
              placeholder="2019"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Start date</label>
              <input
                type="date"
                className="form-input"
                value={f.startDate}
                onChange={set('startDate')}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End date</label>
              <input
                type="date"
                className="form-input"
                value={f.endDate}
                onChange={set('endDate')}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={f.description}
              onChange={set('description')}
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

export default AcademicYearsPage;
