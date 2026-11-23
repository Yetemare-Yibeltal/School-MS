import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { useAuthStore } from '../../store/authStore';

const LANGUAGES = [
  'Amharic',
  'English',
  'Oromiffa',
  'Tigrinya',
  'Somali',
  'French',
  'Arabic',
  'Other',
];
const authorsOf = (b) => (Array.isArray(b.authors) ? b.authors.join(', ') : b.author || '');
const catName = (b) =>
  b.category && typeof b.category === 'object' ? b.category.name : b.categoryName || '';
const idOf = (v) => (v && typeof v === 'object' ? v._id : v || '');

const empty = {
  title: '',
  authors: '',
  isbn: '',
  category: '',
  publisher: '',
  publicationYear: '',
  edition: '',
  language: 'English',
  totalCopies: '1',
  shelfLocation: '',
  numberOfPages: '',
  finePerDay: '',
  description: '',
  isReference: false,
};

const BooksPage = () => {
  const qc = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const canEdit = ['super_admin', 'admin', 'librarian'].includes(role);
  const canDelete = ['super_admin', 'admin'].includes(role);
  const [params, setParams] = useSearchParams();
  const page = parseInt(params.get('page') || '1', 10);
  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const available = params.get('isAvailable') || '';

  const [modal, setModal] = useState({ open: false, item: null });
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState({});

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.set('page', '1');
    setParams(next);
  };

  const { data: categories = [] } = useQuery({
    queryKey: ['book-categories'],
    queryFn: async () => (await api.get('/library/categories')).data.data.categories || [],
  });
  const { data, isLoading } = useQuery({
    queryKey: ['books', page, search, category, available],
    queryFn: async () => {
      const q = new URLSearchParams({ page, limit: 20 });
      if (search) q.set('search', search);
      if (category) q.set('category', category);
      if (available) q.set('isAvailable', available);
      return (await api.get(`/library/books?${q}`)).data;
    },
    keepPreviousData: true,
  });
  const books = data?.data?.books || [];
  const pg = data?.pagination || {};

  const fail = (err) => toast.error(err.response?.data?.message || 'Request failed.');
  const done = (msg) => () => {
    toast.success(msg);
    qc.invalidateQueries({ queryKey: ['books'] });
    qc.invalidateQueries({ queryKey: ['library-dashboard'] });
    setModal({ open: false, item: null });
  };
  const save = useMutation({
    mutationFn: (p) =>
      modal.item ? api.patch(`/library/books/${modal.item._id}`, p) : api.post('/library/books', p),
    onSuccess: done('Book saved.'),
    onError: fail,
  });
  const remove = useMutation({
    mutationFn: (id) => api.delete(`/library/books/${id}`),
    onSuccess: done('Book deactivated.'),
    onError: fail,
  });

  const openModal = (item) => {
    setErrors({});
    setF(
      item
        ? {
            title: item.title || '',
            authors: authorsOf(item),
            isbn: item.isbn || '',
            category: idOf(item.category),
            publisher: item.publisher || '',
            publicationYear: String(item.publicationYear || ''),
            edition: item.edition || '',
            language: item.language || 'English',
            totalCopies: String(item.totalCopies || 1),
            shelfLocation: item.shelfLocation || '',
            numberOfPages: String(item.numberOfPages || ''),
            finePerDay: String(item.finePerDay ?? ''),
            description: item.description || '',
            isReference: Boolean(item.isReference),
          }
        : empty
    );
    setModal({ open: true, item });
  };

  const set = (k) => (e) => {
    setF((p) => ({ ...p, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: null }));
  };
  const cls = (k) => (errors[k] ? 'form-input-error' : 'form-input');
  const err = (k) => (errors[k] ? <p className="form-error">{errors[k]}</p> : null);

  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (!f.title.trim()) er.title = 'Required';
    if (!f.category) er.category = 'Required';
    if (!f.totalCopies || parseInt(f.totalCopies, 10) < 1) er.totalCopies = 'At least 1';
    setErrors(er);
    if (Object.keys(er).length) {
      return;
    }
    const num = (v) => (v === '' ? undefined : Number(v));
    save.mutate({
      title: f.title.trim(),
      authors: f.authors
        ? f.authors
            .split(',')
            .map((a) => a.trim())
            .filter(Boolean)
        : [],
      isbn: f.isbn.trim() || undefined,
      category: f.category,
      publisher: f.publisher.trim() || undefined,
      publicationYear: num(f.publicationYear),
      edition: f.edition.trim() || undefined,
      language: f.language,
      totalCopies: parseInt(f.totalCopies, 10),
      shelfLocation: f.shelfLocation.trim() || undefined,
      numberOfPages: num(f.numberOfPages),
      finePerDay: num(f.finePerDay),
      description: f.description.trim() || undefined,
      isReference: f.isReference,
    });
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Books</h1>
          <p className="page-subtitle">
            {pg.total ? `${pg.total} books in the library` : 'Book catalogue'}
          </p>
        </div>
        {canEdit && (
          <button type="button" className="btn-primary" onClick={() => openModal(null)}>
            Add Book
          </button>
        )}
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <input
          type="search"
          className="form-input flex-1 min-w-[200px]"
          placeholder="Search title, author, ISBN..."
          value={search}
          onChange={(e) => setParam('search', e.target.value)}
        />
        <select
          className="form-select w-44"
          value={category}
          onChange={(e) => setParam('category', e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="form-select w-40"
          value={available}
          onChange={(e) => setParam('isAvailable', e.target.value)}
        >
          <option value="">All books</option>
          <option value="true">Available only</option>
          <option value="false">Fully issued</option>
        </select>
        {(search || category || available) && (
          <button type="button" className="btn-ghost" onClick={() => setParams({ page: '1' })}>
            Clear
          </button>
        )}
      </div>

      {isLoading && <div className="card p-8 text-center text-slate-400">Loading...</div>}
      {!isLoading && books.length === 0 && (
        <div className="card p-12 text-center text-slate-500">No books found.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {books.map((b) => {
          const total = b.totalCopies || 0;
          const avail = b.availableCopies ?? Math.max(total - (b.issuedCopies || 0), 0);
          const pct = total ? Math.round((avail / total) * 100) : 0;
          return (
            <div key={b._id} className="card p-4">
              <div className="flex gap-3">
                <div className="w-12 h-16 rounded-lg bg-gradient-to-b from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xl flex-shrink-0 overflow-hidden">
                  {b.coverImage?.url ? (
                    <img src={b.coverImage.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    '📕'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 leading-tight line-clamp-2">
                    {b.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {authorsOf(b) || 'Unknown author'}
                  </p>
                  <p className="text-xs text-slate-400">{catName(b)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3 text-xs text-slate-500">
                {b.isbn && <span className="font-mono">ISBN {b.isbn}</span>}
                {b.shelfLocation && <span>Shelf {b.shelfLocation}</span>}
                {b.language && <span className="badge badge-gray">{b.language}</span>}
                {b.isReference && <span className="badge badge-warning">Reference</span>}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Availability</span>
                  <b className={avail > 0 ? 'text-green-600' : 'text-red-600'}>
                    {avail}/{total} copies
                  </b>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${avail > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              {canEdit && (
                <div className="flex gap-2 mt-3">
                  <button type="button" className="btn-outline btn-sm" onClick={() => openModal(b)}>
                    Edit
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      className="btn-danger btn-sm"
                      onClick={() =>
                        window.confirm(`Deactivate "${b.title}"?`) && remove.mutate(b._id)
                      }
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {pg.totalPages > 1 && (
        <div className="card px-5 py-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {pg.totalPages} ({pg.total} books)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-outline btn-sm"
              disabled={!pg.hasPreviousPage}
              onClick={() => setParam('page', String(page - 1))}
            >
              Prev
            </button>
            <button
              type="button"
              className="btn-outline btn-sm"
              disabled={!pg.hasNextPage}
              onClick={() => setParam('page', String(page + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <Modal
        open={modal.open}
        title={modal.item ? 'Edit Book' : 'Add Book'}
        onClose={() => setModal({ open: false, item: null })}
      >
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className={cls('title')} value={f.title} onChange={set('title')} />
            {err('title')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group col-span-2">
              <label className="form-label">Authors (comma separated)</label>
              <input className="form-input" value={f.authors} onChange={set('authors')} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className={errors.category ? 'form-input-error' : 'form-select'}
                value={f.category}
                onChange={set('category')}
              >
                <option value="">Select</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {err('category')}
            </div>
            <div className="form-group">
              <label className="form-label">Language</label>
              <select className="form-select" value={f.language} onChange={set('language')}>
                {LANGUAGES.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">ISBN</label>
              <input className="form-input" value={f.isbn} onChange={set('isbn')} />
            </div>
            <div className="form-group">
              <label className="form-label">Publisher</label>
              <input className="form-input" value={f.publisher} onChange={set('publisher')} />
            </div>
            <div className="form-group">
              <label className="form-label">Publication year</label>
              <input
                type="number"
                className="form-input"
                value={f.publicationYear}
                onChange={set('publicationYear')}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Edition</label>
              <input className="form-input" value={f.edition} onChange={set('edition')} />
            </div>
            <div className="form-group">
              <label className="form-label">Total copies</label>
              <input
                type="number"
                min="1"
                className={cls('totalCopies')}
                value={f.totalCopies}
                onChange={set('totalCopies')}
              />
              {err('totalCopies')}
            </div>
            <div className="form-group">
              <label className="form-label">Shelf location</label>
              <input
                className="form-input"
                value={f.shelfLocation}
                onChange={set('shelfLocation')}
                placeholder="Row A, Shelf 3"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Pages</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={f.numberOfPages}
                onChange={set('numberOfPages')}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fine per day (ETB)</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={f.finePerDay}
                onChange={set('finePerDay')}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 mb-3 text-sm">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={f.isReference}
              onChange={(e) => setF((p) => ({ ...p, isReference: e.target.checked }))}
            />
            Reference only (cannot be borrowed)
          </label>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={f.description}
              onChange={set('description')}
            />
          </div>
          <button type="submit" disabled={save.isPending} className="btn-primary w-full">
            {save.isPending ? 'Saving...' : 'Save book'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default BooksPage;
