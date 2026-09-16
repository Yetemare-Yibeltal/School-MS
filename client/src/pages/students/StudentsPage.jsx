// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// STUDENTS PAGE
// kat-school/client/src/pages/students/StudentsPage.jsx
// ============================================

import React, { useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const STATUSES = ['active', 'inactive', 'graduated', 'transferred', 'suspended', 'expelled'];

// ─── Avatar Cell ──────────────────────────────
const StudentAvatar = ({ student }) => (
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-full bg-indigo-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-indigo-700 font-semibold text-sm">
      {student.photo?.url ? (
        <img
          src={student.photo.url}
          alt={student.firstName}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>
          {student.firstName?.[0]}
          {student.fatherName?.[0]}
        </span>
      )}
    </div>
    <div className="min-w-0">
      <p className="text-sm font-medium text-slate-900 truncate">
        {student.firstName} {student.fatherName} {student.grandFatherName || ''}
      </p>
      <p className="text-xs text-slate-500">{student.studentId}</p>
    </div>
  </div>
);

// ─── Status Badge ──────────────────────────────
const StatusBadge = ({ status }) => {
  const config = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-slate-100 text-slate-700',
    graduated: 'bg-blue-100 text-blue-800',
    transferred: 'bg-purple-100 text-purple-800',
    suspended: 'bg-amber-100 text-amber-800',
    expelled: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`badge text-xs capitalize ${config[status] || 'badge-gray'}`}>{status}</span>
  );
};

// ─── Confirm Delete Modal ──────────────────────
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-slide-up">
        <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-outline flex-1">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className="btn-danger flex-1">
            {loading ? <div className="spinner-sm" /> : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Students Page ─────────────────────────────
const StudentsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [deleteModal, setDeleteModal] = useState({ open: false, student: null });

  // ─── Filter State from URL ──────────────────
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const grade = searchParams.get('grade') || '';
  const status = searchParams.get('status') || 'active';
  const sort = searchParams.get('sort') || 'firstName';
  const order = searchParams.get('order') || 'asc';
  const limit = 20;

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  // ─── Fetch Students ─────────────────────────
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['students', { page, search, grade, status, sort, order, limit }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page,
        limit,
        sort,
        order,
        ...(search && { search }),
        ...(grade && { grade }),
        ...(status && { status }),
      });
      const res = await api.get(`/students?${params}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  const students = data?.data?.students || [];
  const pagination = data?.pagination || {};

  // ─── Fetch Academic Years for Stats ─────────
  const { data: statsData } = useQuery({
    queryKey: ['students-stats'],
    queryFn: async () => {
      const res = await api.get('/students/stats');
      return res.data.data;
    },
  });

  // ─── Delete Mutation ─────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/students/${id}`),
    onSuccess: () => {
      toast.success('Student deactivated successfully.');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['students-stats'] });
      setDeleteModal({ open: false, student: null });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to deactivate student.');
    },
  });

  const canManage = ['super_admin', 'admin', 'receptionist'].includes(user?.role);
  const canDelete = ['super_admin', 'admin'].includes(user?.role);

  // ─── Sort Toggle ─────────────────────────────
  const handleSort = (field) => {
    if (sort === field) {
      updateParam('order', order === 'asc' ? 'desc' : 'asc');
    } else {
      updateParam('sort', field);
      updateParam('order', 'asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sort !== field) return <span className="text-slate-300 ml-1">↕</span>;
    return <span className="text-indigo-600 ml-1">{order === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="space-y-5">
      {/* ─── Page Header ─── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">
            {pagination.total
              ? `${pagination.total.toLocaleString()} student${
                  pagination.total !== 1 ? 's' : ''
                } found`
              : 'Manage enrolled students'}
          </p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Link to="/students/new" className="btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Student
            </Link>
          </div>
        )}
      </div>

      {/* ─── Stats Row ─── */}
      {statsData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            {
              label: 'Total',
              value: statsData.totalStudents,
              color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            },
            {
              label: 'Active',
              value: statsData.activeStudents,
              color: 'bg-green-50 text-green-700 border-green-200',
            },
            {
              label: 'Suspended',
              value: statsData.suspendedStudents,
              color: 'bg-amber-50 text-amber-700 border-amber-200',
            },
            ...GRADES.slice(0, 2).map((g) => ({
              label: g,
              value: statsData.byGrade?.find((bg) => bg._id === g)?.count || 0,
              color: 'bg-slate-50 text-slate-700 border-slate-200',
            })),
          ].map((stat) => (
            <div key={stat.label} className={`p-3 rounded-xl border ${stat.color}`}>
              <p className="text-lg font-bold">{stat.value?.toLocaleString() || 0}</p>
              <p className="text-xs font-medium mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ─── Filters ─── */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
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
              placeholder="Search by name, ID, phone..."
              className="form-input pl-9"
            />
          </div>

          {/* Grade Filter */}
          <select
            value={grade}
            onChange={(e) => updateParam('grade', e.target.value)}
            className="form-select w-full sm:w-36"
          >
            <option value="">All Grades</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => updateParam('status', e.target.value)}
            className="form-select w-full sm:w-36"
          >
            <option value="">All Status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>

          {/* Clear */}
          {(search || grade || status !== 'active') && (
            <button
              onClick={() => setSearchParams({ page: '1', status: 'active' })}
              className="btn-ghost text-sm"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="card overflow-hidden">
        <div className="table-container rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <button
                    onClick={() => handleSort('firstName')}
                    className="flex items-center hover:text-slate-700"
                  >
                    Student <SortIcon field="firstName" />
                  </button>
                </th>
                <th>
                  <button
                    onClick={() => handleSort('grade')}
                    className="flex items-center hover:text-slate-700"
                  >
                    Grade <SortIcon field="grade" />
                  </button>
                </th>
                <th>Section</th>
                <th>Gender</th>
                <th>
                  <button
                    onClick={() => handleSort('admissionDate')}
                    className="flex items-center hover:text-slate-700"
                  >
                    Admission <SortIcon field="admissionDate" />
                  </button>
                </th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j}>
                        <div className="h-4 bg-slate-100 rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="text-4xl mb-3">🎓</div>
                    <p className="text-slate-500 font-medium">No students found</p>
                    <p className="text-slate-400 text-sm mt-1">
                      {search ? `No results for "${search}"` : 'Try adjusting your filters'}
                    </p>
                    {canManage && (
                      <Link to="/students/new" className="btn-primary mt-4 inline-flex">
                        Add First Student
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50">
                    <td>
                      <StudentAvatar student={student} />
                    </td>
                    <td>
                      <span className="badge badge-primary text-xs">{student.grade}</span>
                    </td>
                    <td className="text-slate-600">
                      {student.section?.name || student.sectionName || '—'}
                    </td>
                    <td>
                      <span
                        className={`badge text-xs ${
                          student.gender === 'Female' ? 'badge-info' : 'badge-gray'
                        }`}
                      >
                        {student.gender}
                      </span>
                    </td>
                    <td className="text-slate-500 text-xs">
                      {student.admissionDate
                        ? new Date(student.admissionDate).toLocaleDateString('en-ET', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td>
                      <StatusBadge status={student.status} />
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/students/${student._id}`}
                          className="btn-icon btn-ghost"
                          title="View details"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </Link>
                        {canManage && (
                          <Link
                            to={`/students/${student._id}/edit`}
                            className="btn-icon btn-ghost"
                            title="Edit"
                          >
                            <svg
                              className="w-4 h-4"
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
                          </Link>
                        )}
                        {canDelete && student.status === 'active' && (
                          <button
                            onClick={() => setDeleteModal({ open: true, student })}
                            className="btn-icon text-slate-400 hover:text-red-500 hover:bg-red-50"
                            title="Deactivate"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination ─── */}
        {pagination.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {pagination.from}–{pagination.to} of {pagination.total.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => updateParam('page', String(page - 1))}
                disabled={!pagination.hasPreviousPage}
                className="btn-outline btn-sm disabled:opacity-40"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2 + i, pagination.totalPages - 4 + i));
                return (
                  <button
                    key={p}
                    onClick={() => updateParam('page', String(p))}
                    className={`w-8 h-8 rounded-lg text-sm font-medium ${
                      p === page ? 'bg-indigo-600 text-white' : 'btn-ghost'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
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
      </div>

      {/* ─── Confirm Modal ─── */}
      <ConfirmModal
        isOpen={deleteModal.open}
        title="Deactivate Student"
        message={`Are you sure you want to deactivate ${deleteModal.student?.firstName} ${deleteModal.student?.fatherName}? This will mark them as inactive.`}
        onConfirm={() => deleteMutation.mutate(deleteModal.student?._id)}
        onCancel={() => setDeleteModal({ open: false, student: null })}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default StudentsPage;
