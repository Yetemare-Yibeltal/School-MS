import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { useAuthStore } from '../../store/authStore';

const TYPES = [
  'Academic',
  'Cultural',
  'Sport',
  'Exam',
  'Holiday',
  'Meeting',
  'Workshop',
  'Community',
  'Other',
];
const AUDIENCES = ['all', 'students', 'parents', 'teachers', 'employees'];
const today = () => new Date().toISOString().split('T')[0];
const day = (d) => (d ? new Date(d).toISOString().split('T')[0] : '');
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    : '-';

const empty = () => ({
  title: '',
  type: 'Academic',
  description: '',
  startDate: today(),
  endDate: today(),
  startTime: '08:00',
  endTime: '17:00',
  isAllDay: false,
  venue: '',
  audience: ['all'],
  color: '#4f46e5',
});

const EventsPage = () => {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const canWrite = ['super_admin', 'admin', 'teacher'].includes(role);
  const isAdmin = ['super_admin', 'admin'].includes(role);
  const [params, setParams] = useSearchParams();
  const page = parseInt(params.get('page') || '1', 10);
  const type = params.get('type') || '';
  const search = params.get('search') || '';

  const [modal, setModal] = useState({ open: false, item: null });
  const [f, setF] = useState(empty());
  const [errors, setErrors] = useState({});

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.set('page', '1');
    setParams(next);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['events', page, type, search],
    queryFn: async () => {
      const q = new URLSearchParams({ page, limit: 15 });
      if (type) q.set('type', type);
      if (search) q.set('search', search);
      return (await api.get(`/communications/events?${q}`)).data;
    },
    keepPreviousData: true,
  });
  const events = data?.data?.events || [];
  const pg = data?.pagination || {};

  const fail = (err) => toast.error(err.response?.data?.message || 'Request failed.');
  const act = (fn, msg) => ({
    mutationFn: fn,
    onSuccess: () => {
      toast.success(msg);
      qc.invalidateQueries({ queryKey: ['events'] });
      setModal({ open: false, item: null });
    },
    onError: fail,
  });
  const save = useMutation(
    act(
      (p) =>
        modal.item
          ? api.patch(`/communications/events/${modal.item._id}`, p)
          : api.post('/communications/events', p),
      'Event saved.'
    )
  );
  const publish = useMutation(
    act((id) => api.post(`/communications/events/${id}/publish`), 'Event published.')
  );
  const register = useMutation(
    act((id) => api.post(`/communications/events/${id}/register`), 'Registered for event.')
  );
  const cancel = useMutation(
    act((id) => api.delete(`/communications/events/${id}`), 'Event cancelled.')
  );

  const openModal = (item) => {
    setErrors({});
    setF(
      item
        ? {
            title: item.title || '',
            type: item.type || 'Academic',
            description: item.description || '',
            startDate: day(item.startDate) || today(),
            endDate: day(item.endDate || item.startDate) || today(),
            startTime: item.startTime || '08:00',
            endTime: item.endTime || '17:00',
            isAllDay: Boolean(item.isAllDay),
            venue: item.venue || '',
            audience: Array.isArray(item.targetAudience) ? item.targetAudience : ['all'],
            color: item.color || '#4f46e5',
          }
        : empty()
    );
    setModal({ open: true, item });
  };

  const set = (k) => (e) => {
    setF((p) => ({ ...p, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: null }));
  };
  const toggleAudience = (a) =>
    setF((p) => {
      if (a === 'all') return { ...p, audience: ['all'] };
      const base = p.audience.filter((x) => x !== 'all');
      return { ...p, audience: base.includes(a) ? base.filter((x) => x !== a) : [...base, a] };
    });

  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (!f.title.trim()) er.title = 'Required';
    if (!f.startDate) er.startDate = 'Required';
    if (f.endDate && f.endDate < f.startDate) er.endDate = 'End must be after start';
    setErrors(er);
    if (Object.keys(er).length) {
      return;
    }
    save.mutate({
      title: f.title.trim(),
      type: f.type,
      description: f.description.trim() || undefined,
      startDate: f.startDate,
      endDate: f.endDate || f.startDate,
      isAllDay: f.isAllDay,
      startTime: f.isAllDay ? undefined : f.startTime,
      endTime: f.isAllDay ? undefined : f.endTime,
      venue: f.venue.trim() || undefined,
      targetAudience: f.audience,
      color: f.color,
    });
  };

  const cls = (k) => (errors[k] ? 'form-input-error' : 'form-input');
  const err = (k) => (errors[k] ? <p className="form-error">{errors[k]}</p> : null);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-subtitle">{pg.total ? `${pg.total} events` : 'School calendar'}</p>
        </div>
        {canWrite && (
          <button type="button" className="btn-primary" onClick={() => openModal(null)}>
            Add Event
          </button>
        )}
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <input
          type="search"
          className="form-input flex-1 min-w-[200px]"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setParam('search', e.target.value)}
        />
        <select
          className="form-select w-40"
          value={type}
          onChange={(e) => setParam('type', e.target.value)}
        >
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      {isLoading && <div className="card p-8 text-center text-slate-400">Loading...</div>}
      {!isLoading && events.length === 0 && (
        <div className="card p-12 text-center text-slate-500">No events found.</div>
      )}

      <div className="space-y-3">
        {events.map((ev) => {
          const past = new Date(ev.endDate || ev.startDate) < new Date();
          return (
            <div key={ev._id} className={`card p-5 flex gap-4 ${past ? 'opacity-70' : ''}`}>
              <div
                className="w-14 h-14 rounded-xl text-white flex flex-col items-center justify-center flex-shrink-0"
                style={{ backgroundColor: ev.color || '#4f46e5' }}
              >
                <span className="text-lg font-black leading-none">
                  {new Date(ev.startDate).getDate()}
                </span>
                <span className="text-[10px] uppercase">
                  {new Date(ev.startDate).toLocaleDateString('en-GB', { month: 'short' })}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900">{ev.title}</h3>
                  <span className="badge badge-primary">{ev.type}</span>
                  <span className="badge badge-gray capitalize">{ev.status}</span>
                  {past && <span className="badge badge-gray">Past</span>}
                </div>
                {ev.description && (
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{ev.description}</p>
                )}
                <p className="text-xs text-slate-400 mt-2">
                  {fmt(ev.startDate)}
                  {ev.endDate && day(ev.endDate) !== day(ev.startDate) && ` to ${fmt(ev.endDate)}`}
                  {ev.startTime && ` · ${ev.startTime}-${ev.endTime}`}
                  {ev.venue && ` · ${ev.venue}`}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {ev.requiresRegistration && !past && (
                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      onClick={() => register.mutate(ev._id)}
                    >
                      Register
                    </button>
                  )}
                  {canWrite && ev.status !== 'published' && (
                    <button
                      type="button"
                      className="btn-success btn-sm"
                      onClick={() => publish.mutate(ev._id)}
                    >
                      Publish
                    </button>
                  )}
                  {canWrite && (
                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      onClick={() => openModal(ev)}
                    >
                      Edit
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      type="button"
                      className="btn-danger btn-sm"
                      onClick={() => window.confirm('Cancel this event?') && cancel.mutate(ev._id)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {pg.totalPages > 1 && (
        <div className="card px-5 py-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {pg.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-outline btn-sm"
              disabled={page <= 1}
              onClick={() => setParam('page', String(page - 1))}
            >
              Prev
            </button>
            <button
              type="button"
              className="btn-outline btn-sm"
              disabled={page >= pg.totalPages}
              onClick={() => setParam('page', String(page + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <Modal
        open={modal.open}
        title={modal.item ? 'Edit Event' : 'Add Event'}
        onClose={() => setModal({ open: false, item: null })}
      >
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className={cls('title')} value={f.title} onChange={set('title')} />
            {err('title')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Type</label>
              <input
                className="form-input"
                list="event-types"
                value={f.type}
                onChange={set('type')}
              />
              <datalist id="event-types">
                {TYPES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
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
              <label className="form-label">Start date</label>
              <input
                type="date"
                className={cls('startDate')}
                value={f.startDate}
                onChange={set('startDate')}
              />
              {err('startDate')}
            </div>
            <div className="form-group">
              <label className="form-label">End date</label>
              <input
                type="date"
                className={cls('endDate')}
                min={f.startDate}
                value={f.endDate}
                onChange={set('endDate')}
              />
              {err('endDate')}
            </div>
            {!f.isAllDay && (
              <>
                <div className="form-group">
                  <label className="form-label">Start time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={f.startTime}
                    onChange={set('startTime')}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={f.endTime}
                    onChange={set('endTime')}
                  />
                </div>
              </>
            )}
          </div>
          <label className="flex items-center gap-2 mb-3 text-sm">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={f.isAllDay}
              onChange={(e) => setF((p) => ({ ...p, isAllDay: e.target.checked }))}
            />
            All-day event
          </label>
          <div className="form-group">
            <label className="form-label">Venue</label>
            <input className="form-input" value={f.venue} onChange={set('venue')} />
          </div>
          <div className="form-group">
            <label className="form-label">Audience</label>
            <div className="flex flex-wrap gap-2">
              {AUDIENCES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAudience(a)}
                  className={`px-3 py-1.5 rounded-lg text-xs border capitalize ${
                    f.audience.includes(a)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white border-slate-300'
                  }`}
                >
                  {a}
                </button>
              ))}
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
            {save.isPending ? 'Saving...' : 'Save event'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default EventsPage;
