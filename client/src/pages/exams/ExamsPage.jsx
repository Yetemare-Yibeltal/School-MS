// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// EXAMS PAGE
// kat-school/client/src/pages/exams/ExamsPage.jsx
// ============================================

import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const STATUSES = ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'];

const StatusBadge = ({ status }) => {
  const config = {
    scheduled: 'bg-blue-100 text-blue-800',
    ongoing: 'bg-green-100 text-green-800',
    completed: 'bg-slate-100 text-slate-700',
    cancelled: 'bg-red-100 text-red-800',
    postponed: 'bg-amber-100 text-amber-800',
  };
  return (
    <span className={`badge text-xs capitalize ${config[status] || 'badge-gray'}`}>{status}</span>
  );
};

const ExamsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const grade = searchParams.get('grade') || '';
  const status = searchParams.get('status') || '';
  const subject = searchParams.get('subject') || '';

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    value ? next.set(key, value) : next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['exams', { page, search, grade, status, subject }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(search && { search }),
        ...(grade && { grade }),
        ...(status && { status }),
        ...(subject && { subject }),
      });
      const res = await api.get(`/exams?${params}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  const { data: statsData } = useQuery({
    queryKey: ['exam-dashboard'],
    queryFn: async () => {
      const res = await api.get('/exams/dashboard');
      return res.data.data;
    },
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects-list'],
    queryFn: async () => {
      const res = await api.get('/academic/subjects?isActive=true');
      return res.data.data.subjects;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/exams/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Exam status updated.');
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exam-dashboard'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/exams/${id}`),
    onSuccess: () => {
      toast.success('Exam deleted.');
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const exams = data?.data?.exams || [];
  const pagination = data?.pagination || {};
  const canManage = ['super_admin', 'admin', 'teacher'].includes(user?.role);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Examinations</h1>
          <p className="page-subtitle">
            {pagination.total
              ? `${pagination.total} exam${pagination.total !== 1 ? 's' : ''}`
              : 'Manage school exams and assessments'}
          </p>
        </div>
        {canManage && (
          <Link to="/exams/new" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Schedule Exam
          </Link>
        )}
      </div>

      {/* Dashboard Stats */}
      {statsData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: 'Total Exams',
              value: statsData.totalExams,
              color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
            },
            {
              label: 'Scheduled',
              value: statsData.scheduled,
              color: 'bg-blue-50 border-blue-200 text-blue-700',
            },
            {
              label: 'Ongoing',
              value: statsData.ongoing,
              color: 'bg-green-50 border-green-200 text-green-700',
            },
            {
              label: 'Completed',
              value: statsData.completed,
              color: 'bg-slate-50 border-slate-200 text-slate-700',
            },
          ].map((stat) => (
            <div key={stat.label} className={`p-3 rounded-xl border ${stat.color} text-center`}>
              <p className="text-2xl font-bold">{stat.value || 0}</p>
              <p className="text-xs font-medium mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

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
              placeholder="Search exam title, subject..."
              className="form-input pl-9"
            />
          </div>
          <select
            value={grade}
            onChange={(e) => updateParam('grade', e.target.value)}
            className="form-select w-32"
          >
            <option value="">All Grades</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select
            value={subject}
            onChange={(e) => updateParam('subject', e.target.value)}
            className="form-select w-36"
          >
            <option value="">All Subjects</option>
            {(subjectsData || []).map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => updateParam('status', e.target.value)}
            className="form-select w-32"
          >
            <option value="">All Status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
          {(search || grade || status || subject) && (
            <button onClick={() => setSearchParams({ page: '1' })} className="btn-ghost text-sm">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Exams Table */}
      <div className="card overflow-hidden">
        <div className="table-container rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Exam Title</th>
                <th>Subject</th>
                <th>Grade</th>
                <th>Type</th>
                <th>Date</th>
                <th>Total Marks</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j}>
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : exams.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="text-4xl mb-3">📝</div>
                    <p className="text-slate-500 font-medium">No exams found</p>
                    {canManage && (
                      <Link to="/exams/new" className="btn-primary mt-4 inline-flex">
                        Schedule First Exam
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                exams.map((exam) => (
                  <tr key={exam._id} className="hover:bg-slate-50">
                    <td>
                      <p className="text-sm font-medium text-slate-900">{exam.title}</p>
                      {exam.invigilatorName && (
                        <p className="text-xs text-slate-400">
                          Invigilator: {exam.invigilatorName}
                        </p>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-primary text-xs">{exam.subjectName}</span>
                    </td>
                    <td className="text-slate-600 text-sm">{exam.grade}</td>
                    <td>
                      <span className="badge badge-gray text-xs">
                        {exam.examTypeName || exam.examTypeCode}
                      </span>
                    </td>
                    <td>
                      <p className="text-sm text-slate-700">
                        {new Date(exam.startDate).toLocaleDateString('en-ET', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      {exam.startTime && (
                        <p className="text-xs text-slate-400">
                          {exam.startTime} — {exam.endTime}
                        </p>
                      )}
                    </td>
                    <td className="text-sm font-medium text-slate-700">
                      {exam.totalMarks}
                      <span className="text-slate-400 text-xs"> / pass: {exam.passingMarks}</span>
                    </td>
                    <td>
                      <StatusBadge status={exam.status} />
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/exams/${exam._id}`}
                          className="btn-icon btn-ghost"
                          title="View Details"
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
                        {canManage && exam.status !== 'completed' && exam.status !== 'cancelled' && (
                          <>
                            <Link
                              to={`/exams/${exam._id}/results`}
                              className="btn-icon btn-ghost"
                              title="Enter Results"
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
                            {exam.status === 'scheduled' && (
                              <button
                                onClick={() =>
                                  updateStatusMutation.mutate({ id: exam._id, status: 'ongoing' })
                                }
                                className="btn-icon text-green-500 hover:bg-green-50"
                                title="Mark Ongoing"
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
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </button>
                            )}
                          </>
                        )}
                        {['super_admin', 'admin'].includes(user?.role) &&
                          !['completed'].includes(exam.status) && (
                            <button
                              onClick={() => {
                                if (confirm(`Delete exam "${exam.title}"?`))
                                  deleteMutation.mutate(exam._id);
                              }}
                              className="btn-icon text-slate-400 hover:text-red-500 hover:bg-red-50"
                              title="Delete"
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {pagination.from}–{pagination.to} of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => updateParam('page', String(page - 1))}
                disabled={!pagination.hasPreviousPage}
                className="btn-outline btn-sm disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-sm text-slate-600 px-2">
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
      </div>

      {/* Recent Results */}
      {statsData?.recentResults?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Recently Published Results</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {statsData.recentResults.map((result) => (
              <div key={result._id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                  {result.studentName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {result.studentName}
                  </p>
                  <p className="text-xs text-slate-400">{result.exam?.title}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold text-slate-700">{result.marksObtained}</span>
                  <span
                    className={`badge text-xs font-bold ${
                      result.gradeLetter === 'A'
                        ? 'bg-green-100 text-green-800'
                        : result.gradeLetter === 'B'
                        ? 'bg-blue-100 text-blue-800'
                        : result.gradeLetter === 'C'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {result.gradeLetter}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamsPage;
