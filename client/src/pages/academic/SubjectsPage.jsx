import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { useAuthStore } from '../../store/authStore';

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const CATEGORIES = [
  'Core',
  'Languages',
  'Sciences',
  'Social Studies',
  'Elective',
  'Vocational',
  'Arts',
  'Sports',
];
const empty = {
  name: '',
  code: '',
  category: 'Core',
  grades: [],
  weeklyHours: '4',
  periodsPerWeek: '4',
  fullMarks: '100',
  caMarks: '50',
  examMarks: '50',
  passingScore: '50',
  isCompulsory: true,
};

const SubjectsPage = () => {
  const qc = useQueryClient();
  const canEdit = ['super_admin', 'admin'].includes(useAuthStore((s) => s.user?.role));
  const [grade, setGrade] = useState('');
  const [modal, setModal] = useState({ open: false, item: null });
  const [f, setF] = useState(empty);

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['subjects', grade],
    queryFn: async () =>
      (await api.get(`/academic/subjects${grade ? `?grade=${grade}` : ''}`)).data.data.subjects,
  });

  const done = (msg) => () => {
    toast.success(msg);
    qc.invalidateQueries({ queryKey: ['subjects'] });
    setModal({ open: false, item: null });
  };
  const fail = (err) => toast.error(err.response?.data?.message || 'Request failed.');

  const save = useMutation({
    mutationFn: (p) =>
      modal.item
        ? api.patch(`/academic/subjects/${modal.item._id}`, p)
        : api.post('/academic/subjects', p),
    onSuccess: done('Saved.'),
    onError: fail,
  });
  const remove = useMutation({
    mutationFn: (id) => api.delete(`/academic/subjects/${id}`),
    onSuccess: done('Subject deactivated.'),
    onError: fail,
  });

  const openModal = (item) => {
    setF(
      item
        ? {
            name: item.name,
            code: item.code,
            category: item.category,
            grades: item.grades || [],
            weeklyHours: String(item.weeklyHours ?? 4),
            periodsPerWeek: String(item.periodsPerWeek ?? 4),
            fullMarks: String(item.fullMarks ?? 100),
            caMarks: String(item.caMarks ?? 50),
            examMarks: String(item.examMarks ?? 50),
            passingScore: String(item.passingScore ?? 50),
            isCompulsory: item.isCompulsory !== false,
          }
        : empty
    );
    setModal({ open: true, item });
  };

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const toggleGrade = (g) =>
    setF((p) => ({
      ...p,
      grades: p.grades.includes(g) ? p.grades.filter((x) => x !== g) : [...p.grades, g],
    }));

  const submit = (e) => {
    e.preventDefault();
    if (!f.name.trim() || !f.code.trim() || f.grades.length === 0) {
      toast.error('Name, code and at least one grade are required.');
      return;
    }
    const n = (v) => parseInt(v, 10) || 0;
    save.mutate({
      name: f.name.trim(),
      code: f.code.trim().toUpperCase(),
      category: f.category,
      grades: f.grades,
      weeklyHours: n(f.weeklyHours),
      periodsPerWeek: n(f.periodsPerWeek),
      fullMarks: n(f.fullMarks),
      caMarks: n(f.caMarks),
      examMarks: n(f.examMarks),
      passingScore: n(f.passingScore),
      isCompulsory: f.isCompulsory,
    });
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subjects</h1>
          <p className="page-subtitle">{subjects.length} subjects</p>
        </div>
        <div className="flex gap-2">
          <select
            className="form-select w-36"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          >
            <option value="">All grades</option>
            {GRADES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
          {canEdit && (
            <button type="button" className="btn-primary" onClick={() => openModal(null)}>
              Add Subject
            </button>
          )}
        </div>
      </div>

      {isLoading && <div className="card p-8 text-center text-slate-400">Loading...</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((s) => (
          <div key={s._id} className="card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">{s.name}</h3>
              <span className="badge badge-gray">{s.code}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{s.category}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {(s.grades || []).map((g) => (
                <span key={g} className="badge badge-primary">
                  {g.replace('Grade ', 'G')}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {s.periodsPerWeek} periods/week · pass {s.passingScore}/{s.fullMarks}
            </p>
            {canEdit && (
              <div className="flex gap-2 mt-3">
                <button type="button" className="btn-outline btn-sm" onClick={() => openModal(s)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="btn-danger btn-sm"
                  onClick={() => window.confirm(`Deactivate ${s.name}?`) && remove.mutate(s._id)}
                >
                  Deactivate
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        open={modal.open}
        title={modal.item ? 'Edit Subject' : 'Add Subject'}
        onClose={() => setModal({ open: false, item: null })}
      >
        <form onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group col-span-2">
              <label className="form-label">Name</label>
              <input className="form-input" value={f.name} onChange={set('name')} />
            </div>
            <div className="form-group">
              <label className="form-label">Code</label>
              <input className="form-input" value={f.code} onChange={set('code')} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={f.category} onChange={set('category')}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Grades</label>
            <div className="flex flex-wrap gap-2">
              {GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGrade(g)}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${
                    f.grades.includes(g)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white border-slate-300'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              ['weeklyHours', 'Weekly hours'],
              ['periodsPerWeek', 'Periods/week'],
              ['fullMarks', 'Full marks'],
              ['caMarks', 'CA marks'],
              ['examMarks', 'Exam marks'],
              ['passingScore', 'Pass score'],
            ].map(([k, label]) => (
              <div key={k} className="form-group">
                <label className="form-label">{label}</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={f[k]}
                  onChange={set(k)}
                />
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 mb-4 text-sm">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={f.isCompulsory}
              onChange={(e) => setF((p) => ({ ...p, isCompulsory: e.target.checked }))}
            />
            Compulsory subject
          </label>
          <button type="submit" disabled={save.isPending} className="btn-primary w-full">
            {save.isPending ? 'Saving...' : 'Save'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default SubjectsPage;
