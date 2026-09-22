// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// BOOKS PAGE
// kat-school/client/src/pages/library/BooksPage.jsx
// ============================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Modal = ({ isOpen, title, children, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
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
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const BooksPage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [modal, setModal] = useState({ open: false, type: null, data: null });
  const [errors, setErrors] = useState({});

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const available = searchParams.get('available') || '';

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    value ? next.set(key, value) : next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const initForm = () => ({
    title: '',
    author: '',
    isbn: '',
    category: '',
    publisher: '',
    publishYear: '',
    edition: '',
    totalCopies: '1',
    description: '',
    language: 'Amharic',
    accessionNumber: '',
    location: '',
  });
  const [form, setForm] = useState(initForm());

  const { data: categoriesData } = useQuery({
    queryKey: ['book-categories'],
    queryFn: async () => {
      const res = await api.get('/library/categories');
      return res.data.data.categories;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['books', { page, search, category, available }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(search && { search }),
        ...(category && { category }),
        ...(available && { available }),
      });
      const res = await api.get(`/library/books?${params}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/library/books', data),
    onSuccess: () => {
      toast.success('Book added to library.');
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['library-dashboard'] });
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/library/books/${id}`, data),
    onSuccess: () => {
      toast.success('Book updated.');
      queryClient.invalidateQueries({ queryKey: ['books'] });
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/library/books/${id}`),
    onSuccess: () => {
      toast.success('Book removed from library.');
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['library-dashboard'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const closeModal = () => {
    setModal({ open: false, type: null, data: null });
    setForm(initForm());
    setErrors({});
  };

  const openCreate = () => {
    setForm(initForm());
    setModal({ open: true, type: 'create', data: null });
  };
  const openEdit = (book) => {
    setForm({
      title: book.title,
      author: book.author || '',
      isbn: book.isbn || '',
      category: book.category?._id || book.category || '',
      publisher: book.publisher || '',
      publishYear: String(book.publishYear || ''),
      edition: book.edition || '',
      totalCopies: String(book.totalCopies || 1),
      description: book.description || '',
      language: book.language || 'Amharic',
      accessionNumber: book.accessionNumber || '',
      location: book.location || '',
    });
    setModal({ open: true, type: 'edit', data: book });
  };

  const updateField = (f, v) => {
    setForm((p) => ({ ...p, [f]: v }));
    if (errors[f]) setErrors((p) => ({ ...p, [f]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Title is required.';
    if (!form.category) newErrors.category = 'Category is required.';
    if (!form.totalCopies || parseInt(form.totalCopies) < 1)
      newErrors.totalCopies = 'At least 1 copy.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      title: form.title.trim(),
      author: form.author.trim() || undefined,
      isbn: form.isbn.trim() || undefined,
      category: form.category,
      publisher: form.publisher.trim() || undefined,
      publishYear: form.publishYear ? parseInt(form.publishYear) : undefined,
      edition: form.edition.trim() || undefined,
      totalCopies: parseInt(form.totalCopies) || 1,
      description: form.description.trim() || undefined,
      language: form.language,
      accessionNumber: form.accessionNumber.trim() || undefined,
      location: form.location.trim() || undefined,
    };
    if (modal.type === 'create') createMutation.mutate(payload);
    else updateMutation.mutate({ id: modal.data._id, data: payload });
  };

  const books = data?.data?.books || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Books</h1>
          <p className="page-subtitle">
            {pagination.total
              ? `${pagination.total} book${pagination.total !== 1 ? 's' : ''} in the library`
              : 'Book inventory'}
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Book
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => updateParam('search', e.target.value)}
              placeholder="Search by title, author, ISBN..."
              className="form-input pl-9"
            />
          </div>
          <select
            value={category}
            onChange={(e) => updateParam('category', e.target.value)}
            className="form-select w-40"
          >
            <option value="">All Categories</option>
            {(categoriesData || []).map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={available}
            onChange={(e) => updateParam('available', e.target.value)}
            className="form-select w-36"
          >
            <option value="">All Books</option>
            <option value="true">Available Only</option>
            <option value="false">Fully Issued</option>
          </select>
          {(search || category || available) && (
            <button onClick={() => setSearchParams({ page: '1' })} className="btn-ghost text-sm">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Books Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4">
              <div className="h-36 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📚</div>
          <p className="text-slate-500">No books found</p>
          <button onClick={openCreate} className="btn-primary mt-4">
            Add First Book
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((book) => {
            const availableCopies = (book.totalCopies || 0) - (book.issuedCopies || 0);
            return (
              <div key={book._id} className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-14 rounded-lg bg-gradient-to-b from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xl flex-shrink-0 shadow-sm">
                    📕
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-tight">
                      {book.title}
                    </h3>
                    {book.author && (
                      <p className="text-xs text-slate-500 mt-0.5">by {book.author}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">{book.categoryName}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(book)} className="btn-icon btn-ghost">
                      <svg
                        className="w-3.5 h-3.5"
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
                    <button
                      onClick={() => {
                        if (confirm(`Remove "${book.title}"?`)) deleteMutation.mutate(book._id);
                      }}
                      className="btn-icon text-slate-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs mb-3">
                  {book.isbn && <span className="font-mono text-slate-400">ISBN: {book.isbn}</span>}
                  {book.accessionNumber && (
                    <span className="font-mono text-indigo-500">#{book.accessionNumber}</span>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500">Availability</span>
                    <span
                      className={`text-xs font-semibold ${
                        availableCopies > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {availableCopies}/{book.totalCopies} copies
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        availableCopies > 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{
                        width: `${
                          book.totalCopies > 0 ? (availableCopies / book.totalCopies) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`badge text-xs ${
                        availableCopies > 0 ? 'badge-success' : 'badge-danger'
                      }`}
                    >
                      {availableCopies > 0 ? `${availableCopies} Available` : 'All Issued'}
                    </span>
                    {book.language && (
                      <span className="badge badge-gray text-xs">{book.language}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="card px-5 py-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {pagination.from}–{pagination.to} of {pagination.total}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => updateParam('page', String(page - 1))}
              disabled={!pagination.hasPreviousPage}
              className="btn-outline btn-sm disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="text-sm px-2 py-1 text-slate-600">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => updateParam('page', String(page + 1))}
              disabled={!pagination.hasNextPage}
              className="btn-outline btn-sm disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modal.open}
        title={modal.type === 'create' ? 'Add Book' : 'Edit Book'}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Book title"
              className={errors.title ? 'form-input-error' : 'form-input'}
              autoFocus
            />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group mb-0">
              <label className="form-label">Author</label>
              <input
                type="text"
                value={form.author}
                onChange={(e) => updateField('author', e.target.value)}
                placeholder="Author name"
                className="form-input"
              />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">ISBN</label>
              <input
                type="text"
                value={form.isbn}
                onChange={(e) => updateField('isbn', e.target.value)}
                placeholder="978-..."
                className="form-input"
              />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => updateField('category', e.target.value)}
                className={errors.category ? 'form-input-error' : 'form-select'}
              >
                <option value="">Select category</option>
                {(categoriesData || []).map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.category && <p className="form-error">{errors.category}</p>}
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Language</label>
              <select
                value={form.language}
                onChange={(e) => updateField('language', e.target.value)}
                className="form-select"
              >
                {[
                  'Amharic',
                  'English',
                  'Oromifa',
                  'Tigrinya',
                  'Somali',
                  'French',
                  'Arabic',
                  'Other',
                ].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Publisher</label>
              <input
                type="text"
                value={form.publisher}
                onChange={(e) => updateField('publisher', e.target.value)}
                placeholder="Publisher name"
                className="form-input"
              />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Publish Year</label>
              <input
                type="number"
                value={form.publishYear}
                onChange={(e) => updateField('publishYear', e.target.value)}
                min="1900"
                max={new Date().getFullYear()}
                placeholder="e.g. 2020"
                className="form-input"
              />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">
                Total Copies <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.totalCopies}
                onChange={(e) => updateField('totalCopies', e.target.value)}
                min="1"
                className={errors.totalCopies ? 'form-input-error' : 'form-input'}
              />
              {errors.totalCopies && <p className="form-error">{errors.totalCopies}</p>}
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Accession Number</label>
              <input
                type="text"
                value={form.accessionNumber}
                onChange={(e) => updateField('accessionNumber', e.target.value)}
                placeholder="e.g. LIB-001"
                className="form-input"
              />
            </div>
            <div className="form-group mb-0 col-span-2">
              <label className="form-label">Shelf Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder="e.g. Row A, Shelf 3"
                className="form-input"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Brief description of the book..."
              className="form-textarea"
              rows={2}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-outline flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn-primary flex-1"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <div className="spinner-sm" />
              ) : modal.type === 'create' ? (
                'Add Book'
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BooksPage;
