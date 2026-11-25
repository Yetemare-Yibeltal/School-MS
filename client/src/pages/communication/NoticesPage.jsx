import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { useAuthStore } from '../../store/authStore';

const CATEGORIES = ['General', 'Academic', 'Exam', 'Holiday', 'Event', 'Fee', 'Emergency', 'Health', 'Sport'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const AUDIENCES = ['all', 'students', 'parents', 'teachers', 'employees'];
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-GB') : '-');
const today = () => new Date().toISOString().split('T')[0];
const prioClass = (p) =>
  p === 'urgent' ? 'badge-danger' : p === 'high' ? 'badge-warning' : p === 'medium' ? 'badge-info' : 'badge-gray';

const empty = () => ({
  title: '',
  summary: '',
  content: '',
  category: 'General',
  priority: 'medium',
  audience: ['all'],
  publishDate: today(),
  expiryDate: '',
  isPinned: false,
  sendNotification: true,
});

const NoticesPage = () => {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const canWrite = ['super_admin', 'admin', 'teacher'].includes(role);
  const isAdmin = ['super_admin', 'admin'].includes(role);
  const [params, setParams] = useSearchParams();
  const page = parseInt(params.get('page') || '1', 10);
  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const status = params.get('status') || '';

  const [modal, setModal] = useState({ open: false, item: null });
  const [view, setView] = useState(null);
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
    queryKey: ['notices', page, search, category, status],
    queryFn: async () => {
      const q = new URLSearchParams({ page, limit: 15 });
      if (search) q.set('search', search);
      if (category) q.set('category', category);
      if (status) q.set('status', status);
      try {
        return (await api.get(`/communications/notices?${q}`)).data;
      } catch (e) {
        if (e.response?.status === 403) {
          return (await api.get('/communications/notices/published')).data;
        }
        throw e;
      }
    },
    keepPreviousData: true,
  });
  const notices = data?.data?.notices || [];
  const pg = data?.pagination || {};

  const fail = (err) => toast.error(err.response?.data?.message || 'Request failed.');
  const refresh = () => qc.invalidateQueries({ queryKey: ['notices'] });
  const act = (fn, msg) => ({
    mutationFn: fn,
    onSuccess: () => {
      toast.success(msg);
      refresh();
      setModal({ open: false, item: null });
    },
    onError: fail,
  });

  const save = useMutation(
    act((p) => (modal.item ? api.patch(`/communications/notices/${modal.item._id}`, p) : api.post('/communications/notices', p)), 'Notice saved.')
  );
  const publish = useMutation(act((id) => api.post(`/communications/notices/${id}/publish`), 'Notice published.'));
  const recall = useMutation(act((id) => api.post(`/communications/notices/${id}/recall`), 'Notice recalled.'));
  const pin = useMutation(act((id) => api.post(`/communications/notices/${id}/pin`, {}), 'Notice pinned.'));
  const unpin = useMutation(act((id) => api.post(`/communications/notices/${id}/unpin`), 'Notice unpinned.'));
  const remove = useMutation(act((id) => api.delete(`/communications/notices/${id}`), 'Notice deleted.'));

  const openModal = (item) => {
    setErrors({});
    setF(
      item
        ? {
            title: item.title || '',
            summary: item.summary || '',
            content: item.content || '',
            category: item.category || 'General',
            priority: item.priority || 'medium',
            audience: Array.isArray(item.targetAudience) ? item.targetAudience : ['all'],
            publishDate: item.publishDate ? new Date(item.publishDate).toISOString().split('T')[0] : today(),
            expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
            isPinned: Boolean(item.isPinned),
            sendNotification: false,
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
    if (!f.content.trim()) er.content = 'Required';
    if (f.audience.length === 0) er.audience = 'Choose at least one audience';
    setErrors(er);
    if (Object.keys(er).length) {
      return;
    }
    save.mutate({
      title: f.title.trim(),
      summary: f.summary.trim() || undefined,
      content: f.content.trim(),
      category: f.category,
      priority: f.priority,
      targetAudience: f.audience,
      publishDate: f.publishDate || undefined,
      expiryDate: f.expiryDate || undefined,
      isPinned: f.isPinned,
      sendNotification: f.sendNotification,
    });
  };

  const cls = (k) => (errors[k] ? 'form-input-error' : 'form-input');
  const err = (k) => (errors[k] ? <p className="form-error">{errors[k]}</p> : null);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notices</h1>
          <p className="page-subtitle">{pg.total ? `${pg.total} notices` : 'School announcements'}</p>
        </div>
        {canWrite && (
          <button type="button" className="btn-primary" onClick={() => openModal(null)}>
            Post Notice
          </button>
        )}
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <input type="search" className="form-input flex-1 min-w-[200px]" placeholder="Search notices..." value={search} onChange={(e) => setParam('search', e.target.value)} />
        <select className="form-select w-40" value={category} onChange={(e) => setParam('category', e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className="form-select w-36" value={status} onChange={(e) => setParam('status', e.target.value)}>
          <option value="">All status</option>
          {['draft', 'scheduled', 'published', 'recalled', 'expired'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {isLoading && <div className="card p-8 text-center text-slate-400">Loading...</div>}
      {!isLoading && notices.length === 0 && <div className="card p-12 text-center text-slate-500">No notices found.</div>}

      <div className="space-y-3">
        {notices.map((n) => (
          <div key={n._id} className={`card p-5 ${n.isPinned ? 'border-l-4 border-l-amber-400' : ''}`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <button type="button" className="text-left flex-1 min-w-0" onClick={() => setView(n)}>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {n.isPinned && <span>📌</span>}
                  <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                  <span className={`badge capitalize ${prioClass(n.priority)}`}>{n.priority}</span>
                  <span className="badge badge-gray">{n.category}</span>
                  <span className="badge badge-primary capitalize">{n.status}</span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">{n.summary || n.content}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {fmt(n.publishDate || n.createdAt)}
                  {Array.isArray(n.targetAudience) && n.targetAudience.length > 0 && ` · To: ${n.targetAudience.join(', ')}`}
                </p>
              </button>
              {canWrite && (
                <div className="flex flex-wrap gap-2">
                  {n.status !== 'published' && (
                    <button type="button" className="btn-success btn-sm" onClick={() => publish.mutate(n._id)}>
                      Publish
                    </button>
                  )}
                  <button type="button" className="btn-outline btn-sm" onClick={() => openModal(n)}>
                    Edit
                  </button>
                  {isAdmin && (
                    <>
                      <button type="button" className="btn-outline btn-sm" onClick={() => (n.isPinned ? unpin : pin).mutate(n._id)}>
                        {n.isPinned ? 'Unpin' : 'Pin'}
                      </button>
                      {n.status === 'published' && (
                        <button type="button" className="btn-outline btn-sm" onClick={() => window.confirm('Recall this notice?') && recall.mutate(n._id)}>
                          Recall
                        </button>
                      )}
                      <button type="button" className="btn-danger btn-sm" onClick={() => window.confirm('Delete this notice?') && remove.mutate(n._id)}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {pg.totalPages > 1 && (
        <div className="card px-5 py-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {pg.totalPages}
          </p>
          <div className="flex gap-2">
            <button type="button" className="btn-outline btn-sm" disabled={!pg.hasPreviousPage} onClick={() => setParam('page', String(page - 1))}>
              Prev
            </button>
            <button type="button" className="btn-outline btn-sm" disabled={!pg.hasNextPage} onClick={() => setParam('page', String(page + 1))}>
              Next
            </button>
          </div>
        </div>
      )}

      <Modal open={!!view} title={view?.title || ''} onClose={() => setView(null)}>
        {view && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className={`badge capitalize ${prioClass(view.priority)}`}>{view.priority}</span>
              <span className="badge badge-gray">{view.category}</span>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{view.content}</p>
            <p className="text-xs text-slate-400">
              Published {fmt(view.publishDate || view.createdAt)}
              {view.expiryDate && ` · Expires ${fmt(view.expiryDate)}`}
            </p>
          </div>
        )}
      </Modal>

      <Modal open={modal.open} title={modal.item ? 'Edit Notice' : 'Post Notice'} onClose={() => setModal({ open: false, item: null })}>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className={cls('title')} value={f.title} onChange={set('title')} />
            {err('title')}
          </div>
          <div className="form-group">
            <label className="form-label">Summary</label>
            <input className="form-input" value={f.summary} onChange={set('summary')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Category</label>
              <input className="form-input" list="notice-cats" value={f.category} onChange={set('category')} />
              <datalist id="notice-cats">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={f.priority} onChange={set('priority')}>
                {PRIORITIES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Publish date</label>
              <input type="date" className="form-input" value={f.publishDate} onChange={set('publishDate')} />
            </div>
            <div className="form-group">
              <label className="form-label">Expiry date</label>
              <input type="date" className="form-input" min={f.publishDate} value={f.expiryDate} onChange={set('expiryDate')} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Audience</label>
            <div className="flex flex-wrap gap-2">
              {AUDIENCES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAudience(a)}
                  className={`px-3 py-1.5 rounded-lg text-xs border capitalize ${f.audience.includes(a) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-300'}`}
                >
                  {a}
                </button>
              ))}
            </div>
            {err('audience')}
          </div>
          <div className="form-group">
            <label className="form-label">Content</label>
            <textarea rows={6} className={errors.content ? 'form-input-error' : 'form-textarea'} value={f.content} onChange={set('content')} />
            {err('content')}
          </div>
          <div className="flex gap-4 mb-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="form-checkbox" checked={f.isPinned} onChange={(e) => setF((p) => ({ ...p, isPinned: e.target.checked }))} />
              Pin to top
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="form-checkbox" checked={f.sendNotification} onChange={(e) => setF((p) => ({ ...p, sendNotification: e.target.checked }))} />
              Send notification
            </label>
          </div>
          <button type="submit" disabled={save.isPending} className="btn-primary w-full">
            {save.isPending ? 'Saving...' : 'Save notice'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default NoticesPage;