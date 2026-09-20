// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// EXAM DETAIL PAGE
// kat-school/client/src/pages/exams/ExamDetailPage.jsx
// ============================================

import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
    <p className="text-sm text-slate-800 font-medium mt-0.5">{value || '—'}</p>
  </div>
);

const ExamDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: examData, isLoading } = useQuery({
    queryKey: ['exam', id],
    queryFn: async () => {
      const res = await api.get(`/exams/${id}`);
      return res.data.data;
    },
  });

  const { data: resultsData, isLoading: resultsLoading } = useQuery({
    queryKey: ['exam-results', id],
    queryFn: async () => {
      const res = await api.get(`/exams/${id}/results?limit=100`);
      return res.data.data;
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => api.post(`/exams/${id}/publish`),
    onSuccess: () => {
      toast.success('Results published successfully!');
      queryClient.invalidateQueries({ queryKey: ['exam', id] });
      queryClient.invalidateQueries({ queryKey: ['exam-results', id] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Publish failed.'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status) => api.patch(`/exams/${id}/status`, { status }),
    onSuccess: (_, status) => {
      toast.success(`Exam marked as ${status}.`);
      queryClient.invalidateQueries({ queryKey: ['exam', id] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 bg-slate-100 rounded w-64" />
        <div className="card p-6">
          <div className="h-40 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Exam not found.</p>
        <Link to="/exams" className="btn-primary mt-4 inline-flex">
          Back to Exams
        </Link>
      </div>
    );
  }

  const { exam, resultStats } = examData;
  const canManage = ['super_admin', 'admin', 'teacher'].includes(user?.role);
  const results = resultsData?.results || [];
  const stats = resultsData?.stats || resultStats;

  const gradeDistribution = ['A', 'B', 'C', 'D', 'F'].map((letter) => ({
    letter,
    count: results.filter((r) => r.gradeLetter === letter).length,
  }));

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/exams" className="hover:text-slate-700">
          Exams
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium truncate">{exam.title}</span>
      </div>

      {/* Exam Header Card */}
      <div className="card">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h1 className="text-xl font-bold text-slate-900">{exam.title}</h1>
                <span
                  className={`badge text-xs capitalize ${
                    exam.status === 'scheduled'
                      ? 'bg-blue-100 text-blue-800'
                      : exam.status === 'ongoing'
                      ? 'bg-green-100 text-green-800'
                      : exam.status === 'completed'
                      ? 'bg-slate-100 text-slate-700'
                      : exam.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {exam.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="badge badge-primary">{exam.subjectName}</span>
                <span className="badge badge-gray">{exam.grade}</span>
                {exam.sectionName && (
                  <span className="badge badge-gray">Section {exam.sectionName}</span>
                )}
                <span className="badge badge-info">{exam.examTypeName}</span>
              </div>
            </div>
            {canManage && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {exam.status === 'scheduled' && (
                  <button
                    onClick={() => updateStatusMutation.mutate('ongoing')}
                    className="btn-success btn-sm"
                  >
                    Start Exam
                  </button>
                )}
                {exam.status === 'ongoing' && (
                  <button
                    onClick={() => updateStatusMutation.mutate('completed')}
                    className="btn-outline btn-sm"
                  >
                    Mark Complete
                  </button>
                )}
                <Link to={`/exams/${id}/results`} className="btn-primary btn-sm">
                  Enter Results
                </Link>
              </div>
            )}
          </div>

          {/* Exam Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-5 pt-5 border-t border-slate-100">
            <InfoItem
              label="Date"
              value={new Date(exam.startDate).toLocaleDateString('en-ET', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            />
            <InfoItem
              label="Time"
              value={exam.startTime ? `${exam.startTime} – ${exam.endTime}` : 'All Day'}
            />
            <InfoItem label="Duration" value={exam.duration ? `${exam.duration} minutes` : '—'} />
            <InfoItem label="Total Marks" value={String(exam.totalMarks)} />
            <InfoItem label="Passing Marks" value={String(exam.passingMarks)} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <InfoItem label="Academic Year" value={exam.academicYearName} />
            <InfoItem label="Term" value={exam.termName} />
            <InfoItem label="Room" value={exam.room?.name} />
            <InfoItem label="Invigilator" value={exam.invigilatorName} />
          </div>

          {exam.instructions && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-semibold text-blue-700 mb-1">Instructions</p>
              <p className="text-sm text-blue-800">{exam.instructions}</p>
            </div>
          )}
        </div>
      </div>

      {/* Results Summary */}
      {stats && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'bg-slate-50 border-slate-200' },
            { label: 'Present', value: stats.present, color: 'bg-indigo-50 border-indigo-200' },
            { label: 'Absent', value: stats.absent, color: 'bg-red-50 border-red-200' },
            { label: 'Passed', value: stats.passed, color: 'bg-green-50 border-green-200' },
            { label: 'Failed', value: stats.failed, color: 'bg-red-50 border-red-200' },
            {
              label: 'Pass Rate',
              value: stats.passRate !== undefined ? `${stats.passRate}%` : '—',
              color: 'bg-amber-50 border-amber-200',
            },
          ].map((stat) => (
            <div key={stat.label} className={`p-3 rounded-xl border text-center ${stat.color}`}>
              <p className="text-xl font-bold text-slate-900">{stat.value ?? '—'}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Grade Distribution */}
      {results.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Grade Distribution</h3>
          <div className="flex items-end gap-3">
            {gradeDistribution.map(({ letter, count }) => {
              const pct = results.length > 0 ? Math.round((count / results.length) * 100) : 0;
              const colorMap = {
                A: 'bg-green-500',
                B: 'bg-blue-500',
                C: 'bg-amber-500',
                D: 'bg-orange-500',
                F: 'bg-red-500',
              };
              return (
                <div key={letter} className="flex-1 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-slate-600">{pct}%</span>
                    <div
                      className="w-full rounded-t-lg overflow-hidden bg-slate-100"
                      style={{ height: '80px' }}
                    >
                      <div
                        className={`w-full ${colorMap[letter]} rounded-t-lg transition-all`}
                        style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
                      />
                    </div>
                    <span
                      className={`badge text-xs font-bold ${
                        letter === 'A'
                          ? 'bg-green-100 text-green-800'
                          : letter === 'B'
                          ? 'bg-blue-100 text-blue-800'
                          : letter === 'C'
                          ? 'bg-amber-100 text-amber-800'
                          : letter === 'D'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="text-xs text-slate-400">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {stats && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600">
              <span>
                Highest: <strong className="text-slate-900">{stats.highest}</strong>
              </span>
              <span>
                Lowest: <strong className="text-slate-900">{stats.lowest}</strong>
              </span>
              <span>
                Average: <strong className="text-slate-900">{stats.average?.toFixed(1)}</strong>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Results Table */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h3 className="text-sm font-semibold">
            Results {results.length > 0 ? `(${results.length} students)` : ''}
          </h3>
          <div className="flex items-center gap-2">
            {canManage && exam.status === 'completed' && results.some((r) => r.status === 'draft') && (
              <button
                onClick={() => {
                  if (confirm('Publish all results? Students will be notified.'))
                    publishMutation.mutate();
                }}
                disabled={publishMutation.isPending}
                className="btn-primary btn-sm"
              >
                {publishMutation.isPending ? <div className="spinner-sm" /> : '📢 Publish Results'}
              </button>
            )}
          </div>
        </div>
        <div className="table-container rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th>Marks</th>
                <th>%</th>
                <th>Grade</th>
                <th>Status</th>
                <th>Result Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resultsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j}>
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="text-4xl mb-3">📋</div>
                    <p className="text-slate-500">No results entered yet.</p>
                    {canManage && (
                      <Link to={`/exams/${id}/results`} className="btn-primary mt-4 inline-flex">
                        Enter Results
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                results.map((result, index) => (
                  <tr
                    key={result._id}
                    className={`hover:bg-slate-50 ${result.isAbsent ? 'bg-red-50/30' : ''}`}
                  >
                    <td>
                      {result.isAbsent ? (
                        <span className="text-slate-400 text-xs">—</span>
                      ) : (
                        <span
                          className={`text-sm font-bold ${
                            index === 0
                              ? 'text-amber-600'
                              : index === 1
                              ? 'text-slate-600'
                              : index === 2
                              ? 'text-orange-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {result.rank || index + 1}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-indigo-700 font-semibold text-xs">
                          {result.student?.photo?.url ? (
                            <img
                              src={result.student.photo.url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            result.studentName?.[0]
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{result.studentName}</p>
                          <p className="text-xs text-slate-400">{result.studentId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm font-semibold text-slate-700">
                      {result.isAbsent ? (
                        <span className="text-red-400">Absent</span>
                      ) : (
                        `${result.marksObtained}/${result.totalMarks}`
                      )}
                    </td>
                    <td className="text-sm text-slate-600">
                      {result.isAbsent ? '—' : `${result.percentage?.toFixed(1) || 0}%`}
                    </td>
                    <td>
                      {result.gradeLetter && !result.isAbsent && (
                        <span
                          className={`badge text-xs font-bold px-2 py-0.5 rounded ${
                            result.gradeLetter === 'A'
                              ? 'bg-green-100 text-green-800'
                              : result.gradeLetter === 'B'
                              ? 'bg-blue-100 text-blue-800'
                              : result.gradeLetter === 'C'
                              ? 'bg-amber-100 text-amber-800'
                              : result.gradeLetter === 'D'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {result.gradeLetter}
                        </span>
                      )}
                    </td>
                    <td>
                      {result.isAbsent ? (
                        <span className="badge badge-danger text-xs">Absent</span>
                      ) : (
                        <span
                          className={`badge text-xs ${
                            result.isPassed ? 'badge-success' : 'badge-danger'
                          }`}
                        >
                          {result.isPassed ? 'Passed' : 'Failed'}
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge text-xs ${
                          result.status === 'published' ? 'badge-success' : 'badge-warning'
                        }`}
                      >
                        {result.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExamDetailPage;
