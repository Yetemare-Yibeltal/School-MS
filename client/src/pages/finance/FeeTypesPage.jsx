import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { useAuthStore } from '../../store/authStore';

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const CATEGORIES = [
  'Tuition',
  'Registration',
  'Exam',
  'Library',
  'Sport',
  'Transport',
  'Medical',
  'Uniform',
  'Activity',
  'Boarding',
  'Other',
];
const FREQUENCIES = [
  ['annual', 'Annual'],
  ['per_term', 'Per term'],
  ['monthly', 'Monthly'],
  ['one_time', 'One time'],
  ['as_needed', 'As needed'],
];

const empty = {
  name: '',
  code: '',
  category: 'Tuition',
  amount: '',
  frequency: 'annual',
  applicableGrades: GRADES,
  isMandatory: true,
  isRefundable: false,
  lateFineEnabled: false,
  lateFinePerDay: '0',
  gracePeriodDays: '0',
  dueDate: '',
  description: '',
  color: '#4f46e5',
};

const FeeTypesPage = () => {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const canEdit = ['super_admin', 'admin', 'accountant'].includes(role);
  const canDelete = ['super_admin', 'admin'].includes(role);
  const [category, setCategory] = useState('');
  const [modal, setModal] = useState({ open: false, item: null });
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState({});

  const { data: feeTypes = [], isLoading } = useQuery({
    queryKey: ['fee-types', category],
    queryFn: async () =>
      (await api.get(`/finance/fee-types${category ? `?category=${category}` : ''}`)).data.data
        .feeTypes,
  });

  const fail = (err) => toast.error(err.response?.data?.message || 'Request failed.');
  const done = (msg) => () => {
    toast.success(msg);
    qc.invalidateQueries({ queryKey: ['fee-types'] });
    setModal({ open: false, item: null });
  };

  const save = useMutation({
    mutationFn: (p) =>
      modal.item
        ? api.patch(`/finance/fee-types/${modal.item._id}`, p)
        : api.post('/finance/fee-types', p),
    onSuccess: done('Fee type saved.'),
    onError: fail,
  });
  const remove = useMutation({
    mutationFn: (id) => api.delete(`/finance/fee-types/${id}`),
    onSuccess: done('Fee type deactivated.'),
    onError: fail,
  });

  const openModal = (item) => {
    setErrors({});
    setF(
      item
        ? {
            name: item.name,
            code: item.code,
            category: item.category || 'Tuition',
            amount: String(item.amount ?? ''),
            frequency: item.frequency || 'annual',
            applicableGrades: item.applicableGrades?.length ? item.applicableGrades : GRADES,
            isMandatory: item.isMandatory !== false,
            isRefundable: Boolean(item.isRefundable),
            lateFineEnabled: Boolean(item.lateFineEnabled),
            lateFinePerDay: String(item.lateFinePerDay ?? 0),
            gracePeriodDays: String(item.gracePeriodDays ?? 0),
            dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '',
            description: item.description || '',
            color: item.color || '#4f46e5',
          }
        : empty
    );
    setModal({ open: true, item });
  };

  const set = (k) => (e) => {
    setF((p) => ({ ...p, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: null }));
  };
  const toggle = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.checked }));
  const toggleGrade = (g) =>
    setF((p) => ({
      ...p,
      applicableGrades: p.applicableGrades.includes(g)
        ? p.applicableGrades.filter((x) => x !== g)
        : [...p.applicableGrades, g],
    }));

  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (!f.name.trim()) er.name = 'Required';
    if (!f.code.trim()) er.code = 'Required';
    if (f.amount === '' || parseFloat(f.amount) < 0) er.amount = 'Enter a valid amount';
    if (f.applicableGrades.length === 0) er.applicableGrades = 'Select at least one grade';
    setErrors(er);
    if (Object.keys(er).length) {
      return;
    }
    save.mutate({
      name: f.name.trim(),
      code: f.code.trim().toUpperCase(),
      category: f.category,
      amount: parseFloat(f.amount),
      frequency: f.frequency,
      applicableGrades: f.applicableGrades,
      isMandatory: f.isMandatory,
      isRefundable: f.isRefundable,
      lateFineEnabled: f.lateFineEnabled,
      lateFinePerDay: parseFloat(f.lateFinePerDay) || 0,
      gracePeriodDays: parseInt(f.gracePeriodDays, 10) || 0,
      dueDate: f.dueDate || undefined,
      description: f.description || undefined,
      color: f.color,
    });
  };

  const err = (k) => (errors[k] ? <p className="form-error">{errors[k]}</p> : null);
  const cls = (k) => (errors[k] ? 'form-input-error' : 'form-input');

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fee Types</h1>
          <p className="page-subtitle">{feeTypes.length} active fee types</p>
        </div>
        {canEdit && (
          <button type="button" className="btn-primary" onClick={() => openModal(null)}>
            Add Fee Type
          </button>
        )}
      </div>

      <div className="card p-3 flex flex-wrap gap-2">
        {['', ...CATEGORIES].map((c) => (
          <button
            key={c || 'all'}
            type="button"
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
              category === c
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white border-slate-300 text-slate-600'
            }`}
          >
            {c || 'All'}
          </button>
        ))}
      </div>

      {isLoading && <div className="card p-8 text-center text-slate-400">Loading...</div>}
      {!isLoading && feeTypes.length === 0 && (
        <div className="card p-12 text-center text-slate-500">No fee types found.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {feeTypes.map((t) => (
          <div key={t._id} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl text-white font-bold text-sm flex items-center justify-center"
                  style={{ backgroundColor: t.color || '#4f46e5' }}
                >
                  {(t.code || '??').slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t.name}</h3>
                  <div className="flex gap-1 mt-0.5">
                    <span className="badge badge-gray">{t.code}</span>
                    <span className="badge badge-primary">{t.category}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-slate-900">
                  ETB {Number(t.amount || 0).toLocaleString()}
                </span>
                <span className="badge badge-gray capitalize">
                  {(t.frequency || '').replace('_', ' ')}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {(t.applicableGrades || []).map((g) => (
                  <span key={g} className="badge badge-gray">
                    {g.replace('Grade ', 'G')}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {t.isMandatory && <span className="badge badge-warning">Mandatory</span>}
                {t.isRefundable && <span className="badge badge-info">Refundable</span>}
                {t.lateFineEnabled && (
                  <span className="badge badge-danger">Late fine {t.lateFinePerDay}/day</span>
                )}
              </div>
            </div>
            {canEdit && (
              <div className="flex gap-2 mt-3">
                <button type="button" className="btn-outline btn-sm" onClick={() => openModal(t)}>
                  Edit
                </button>
                {canDelete && (
                  <button
                    type="button"
                    className="btn-danger btn-sm"
                    onClick={() => window.confirm(`Deactivate ${t.name}?`) && remove.mutate(t._id)}
                  >
                    Deactivate
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        open={modal.open}
        title={modal.item ? 'Edit Fee Type' : 'Add Fee Type'}
        onClose={() => setModal({ open: false, item: null })}
      >
        <form onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group col-span-2">
              <label className="form-label">Name</label>
              <input
                className={cls('name')}
                value={f.name}
                onChange={set('name')}
                placeholder="Annual Tuition Fee"
              />
              {err('name')}
            </div>
            <div className="form-group">
              <label className="form-label">Code</label>
              <input className={cls('code')} value={f.code} onChange={set('code')} />
              {err('code')}
            </div>
            <div className="form-group">
              <label className="form-label">Colour</label>
              <input
                type="color"
                className="w-full h-10 rounded-lg border border-slate-300"
                value={f.color}
                onChange={set('color')}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={f.category} onChange={set('category')}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (ETB)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={cls('amount')}
                value={f.amount}
                onChange={set('amount')}
              />
              {err('amount')}
            </div>
            <div className="form-group">
              <label className="form-label">Frequency</label>
              <select className="form-select" value={f.frequency} onChange={set('frequency')}>
                {FREQUENCIES.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Default due date</label>
              <input
                type="date"
                className="form-input"
                value={f.dueDate}
                onChange={set('dueDate')}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Applicable grades</label>
            <div className="flex flex-wrap gap-2">
              {GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGrade(g)}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${
                    f.applicableGrades.includes(g)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white border-slate-300'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            {err('applicableGrades')}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={f.isMandatory}
                onChange={toggle('isMandatory')}
              />{' '}
              Mandatory
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={f.isRefundable}
                onChange={toggle('isRefundable')}
              />{' '}
              Refundable
            </label>
            <label className="flex items-center gap-2 col-span-2">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={f.lateFineEnabled}
                onChange={toggle('lateFineEnabled')}
              />{' '}
              Charge late fine
            </label>
          </div>

          {f.lateFineEnabled && (
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">Fine per day (ETB)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className="form-input"
                  value={f.lateFinePerDay}
                  onChange={set('lateFinePerDay')}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Grace period (days)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={f.gracePeriodDays}
                  onChange={set('gracePeriodDays')}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={f.description}
              onChange={set('description')}
            />
          </div>
          <button type="submit" disabled={save.isPending} className="btn-primary w-full">
            {save.isPending ? 'Saving...' : 'Save fee type'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default FeeTypesPage;
