// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// REPORT CARDS PAGE
// kat-school/client/src/pages/exams/ReportCardsPage.jsx
// ============================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const ReportCardsPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewCard, setPreviewCard] = useState(null);

  const canManage = ['super_admin', 'admin', 'teacher'].includes(user?.role);

  const { data: yearsData } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const res = await api.get('/academic/years');
      return res.data.data.academicYears;
    },
  });

  const { data: termsData } = useQuery({
    queryKey: ['terms', selectedAcademicYear],
    queryFn: async () => {
      const res = await api.get(`/academic/terms?academicYear=${selectedAcademicYear}`);
      return res.data.data.terms;
    },
    enabled: !!selectedAcademicYear,
  });

  const { data: sectionsData } = useQuery({
    queryKey: ['sections', selectedGrade],
    queryFn: async () => {
      const res = await api.get(`/academic/sections?grade=${selectedGrade}`);
      return res.data.data.sections;
    },
    enabled: !!selectedGrade,
  });

  const { data: dashboardData } = useQuery({
    queryKey: ['report-card-dashboard', selectedAcademicYear, selectedTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(selectedAcademicYear && { academicYear: selectedAcademicYear }),
        ...(selectedTerm && { term: selectedTerm }),
      });
      const res = await api.get(`/report-cards/dashboard?${params}`);
      return res.data.data;
    },
    enabled: !!selectedAcademicYear,
  });

  const {
    data: sectionCards,
    isLoading: cardsLoading,
    refetch: refetchCards,
  } = useQuery({
    queryKey: ['section-report-cards', selectedSection, selectedAcademicYear, selectedTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(selectedAcademicYear && { academicYear: selectedAcademicYear }),
        ...(selectedTerm && { term: selectedTerm }),
      });
      const res = await api.get(`/report-cards/section/${selectedSection}?${params}`);
      return res.data.data.reportCards;
    },
    enabled: !!selectedSection && !!selectedAcademicYear && !!selectedTerm,
  });

  const handleBulkGenerate = async () => {
    if (!selectedGrade || !selectedAcademicYear || !selectedTerm) {
      toast.error('Please select grade, academic year, and term.');
      return;
    }
    setGenerating(true);
    try {
      const res = await api.post('/report-cards/bulk-generate', {
        grade: selectedGrade,
        section: selectedSection || undefined,
        academicYearId: selectedAcademicYear,
        termId: selectedTerm,
      });
      toast.success(res.data.message);
      refetchCards();
      queryClient.invalidateQueries({ queryKey: ['report-card-dashboard'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleBulkPublish = async () => {
    if (!selectedGrade || !selectedAcademicYear || !selectedTerm) {
      toast.error('Please select grade, academic year, and term.');
      return;
    }
    if (!confirm(`Publish all report cards for ${selectedGrade}? Students will be notified.`))
      return;

    setPublishing(true);
    try {
      const res = await api.post('/report-cards/bulk-publish', {
        grade: selectedGrade,
        section: selectedSection || undefined,
        academicYearId: selectedAcademicYear,
        termId: selectedTerm,
      });
      toast.success(res.data.message);
      refetchCards();
      queryClient.invalidateQueries({ queryKey: ['report-card-dashboard'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Publish failed.');
    } finally {
      setPublishing(false);
    }
  };

  const cards = sectionCards || [];
  const publishedCount = cards.filter((c) => c.status === 'published').length;

  const GradeBadge = ({ letter }) => {
    const colorMap = {
      A: 'bg-green-100 text-green-800',
      B: 'bg-blue-100 text-blue-800',
      C: 'bg-amber-100 text-amber-800',
      D: 'bg-orange-100 text-orange-800',
      F: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`badge text-xs font-bold ${colorMap[letter] || 'badge-gray'}`}>
        {letter}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Report Cards</h1>
          <p className="page-subtitle">Generate and manage student report cards</p>
        </div>
      </div>

      {/* Dashboard Stats */}
      {dashboardData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: 'Total Generated',
              value: dashboardData.total,
              color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
            },
            {
              label: 'Draft',
              value: dashboardData.draft,
              color: 'bg-amber-50 border-amber-200 text-amber-700',
            },
            {
              label: 'Published',
              value: dashboardData.published,
              color: 'bg-green-50 border-green-200 text-green-700',
            },
            {
              label: 'Pending',
              value:
                (dashboardData.total || 0) -
                (dashboardData.draft || 0) -
                (dashboardData.published || 0),
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

      {/* Filters & Actions */}
      <div className="card p-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div className="form-group mb-0">
            <label className="form-label text-xs">Academic Year</label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="form-select"
            >
              <option value="">Select year</option>
              {(yearsData || []).map((y) => (
                <option key={y._id} value={y._id}>
                  {y.name} {y.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group mb-0">
            <label className="form-label text-xs">Term</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              disabled={!selectedAcademicYear}
              className="form-select"
            >
              <option value="">Select term</option>
              {(termsData || []).map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} {t.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group mb-0">
            <label className="form-label text-xs">Grade</label>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setSelectedSection('');
              }}
              className="form-select"
            >
              <option value="">Select grade</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group mb-0">
            <label className="form-label text-xs">Section (optional)</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={!selectedGrade}
              className="form-select"
            >
              <option value="">All sections</option>
              {(sectionsData || []).map((s) => (
                <option key={s._id} value={s._id}>
                  Section {s.name}
                </option>
              ))}
            </select>
          </div>
          {canManage && (
            <div className="form-group mb-0 flex items-end gap-2">
              <button
                onClick={handleBulkGenerate}
                disabled={generating || !selectedGrade || !selectedAcademicYear || !selectedTerm}
                className="btn-primary flex-1"
              >
                {generating ? (
                  <>
                    <div className="spinner-sm" /> Generating...
                  </>
                ) : (
                  '⚙️ Generate'
                )}
              </button>
              {cards.length > 0 && publishedCount < cards.length && (
                <button
                  onClick={handleBulkPublish}
                  disabled={publishing}
                  className="btn-success flex-1"
                >
                  {publishing ? <div className="spinner-sm" /> : '📢 Publish All'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Report Cards Table */}
      {selectedSection && selectedAcademicYear && selectedTerm ? (
        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="text-sm font-semibold">
              Report Cards — {selectedGrade} Section{' '}
              {(sectionsData || []).find((s) => s._id === selectedSection)?.name}
            </h3>
            <div className="text-xs text-slate-500">
              {publishedCount}/{cards.length} published
            </div>
          </div>

          {cardsLoading ? (
            <div className="p-8 text-center">
              <div className="spinner-lg mx-auto" />
            </div>
          ) : cards.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-slate-500 font-medium">No report cards generated yet</p>
              {canManage && (
                <button
                  onClick={handleBulkGenerate}
                  disabled={generating || !selectedGrade}
                  className="btn-primary mt-4"
                >
                  {generating ? <div className="spinner-sm" /> : 'Generate Report Cards'}
                </button>
              )}
            </div>
          ) : (
            <div className="table-container rounded-none border-0">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Student</th>
                    <th>Total Score</th>
                    <th>GPA</th>
                    <th>Subjects Passed</th>
                    <th>Attendance</th>
                    <th>Grade</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cards.map((card, index) => (
                    <tr key={card._id} className="hover:bg-slate-50">
                      <td>
                        <span
                          className={`text-sm font-bold ${
                            index === 0
                              ? 'text-amber-500'
                              : index === 1
                              ? 'text-slate-400'
                              : index === 2
                              ? 'text-orange-600'
                              : 'text-slate-400'
                          }`}
                        >
                          {card.rank || index + 1}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-indigo-700 font-semibold text-xs">
                            {card.student?.photo?.url ? (
                              <img
                                src={card.student.photo.url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              card.studentName?.[0]
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{card.studentName}</p>
                            <p className="text-xs text-slate-400">{card.studentId}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm font-bold text-slate-900">
                          {card.totalScore?.toFixed(1) || '—'}
                        </span>
                        <span className="text-slate-400 text-xs">/100</span>
                      </td>
                      <td>
                        <span className="text-sm font-bold text-indigo-700">
                          {card.gpa?.toFixed(2) || '—'}
                        </span>
                        <span className="text-slate-400 text-xs">/4.0</span>
                      </td>
                      <td>
                        <span
                          className={`text-sm font-medium ${
                            card.failedSubjects > 0 ? 'text-red-600' : 'text-green-700'
                          }`}
                        >
                          {card.passedSubjects}/
                          {(card.passedSubjects || 0) + (card.failedSubjects || 0)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`text-sm font-medium ${
                            (card.attendancePercentage || 0) < 75
                              ? 'text-red-600'
                              : 'text-slate-700'
                          }`}
                        >
                          {card.attendancePercentage?.toFixed(1) || 0}%
                        </span>
                      </td>
                      <td>{card.overallGrade && <GradeBadge letter={card.overallGrade} />}</td>
                      <td>
                        <span
                          className={`badge text-xs ${
                            card.status === 'published'
                              ? 'badge-success'
                              : card.status === 'draft'
                              ? 'badge-warning'
                              : 'badge-gray'
                          }`}
                        >
                          {card.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setPreviewCard(card)}
                            className="btn-icon btn-ghost"
                            title="Preview"
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
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-slate-500 font-medium">
            Select academic year, term, grade and section to view report cards
          </p>
        </div>
      )}

      {/* Preview Modal */}
      {previewCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setPreviewCard(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Report Card Preview</h3>
              <button onClick={() => setPreviewCard(null)} className="btn-icon btn-ghost">
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
            <div className="p-6">
              {/* Student Info */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="w-16 h-16 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 text-2xl font-bold">
                  {previewCard.studentName?.[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{previewCard.studentName}</h2>
                  <p className="text-sm text-slate-500">
                    ID: {previewCard.studentId} &bull; {previewCard.grade}
                  </p>
                  <p className="text-xs text-slate-400">
                    {previewCard.academicYearName} — {previewCard.termName}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-3xl font-black text-indigo-700">
                    {previewCard.gpa?.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500">GPA / 4.0</p>
                  <p className="text-sm font-bold text-slate-700 mt-1">
                    Rank: #{previewCard.rank || '—'}
                  </p>
                </div>
              </div>

              {/* Subject Scores */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Subject Performance</h4>
                <div className="space-y-2">
                  {(previewCard.subjects || [])
                    .filter((s) => s.hasResult)
                    .map((subject) => (
                      <div key={subject.subjectCode} className="flex items-center gap-3">
                        <span className="text-xs text-slate-600 w-32 truncate">
                          {subject.subjectName}
                        </span>
                        <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              (subject.finalScore || 0) >= 85
                                ? 'bg-green-500'
                                : (subject.finalScore || 0) >= 75
                                ? 'bg-blue-500'
                                : (subject.finalScore || 0) >= 65
                                ? 'bg-amber-500'
                                : (subject.finalScore || 0) >= 50
                                ? 'bg-orange-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, subject.finalScore || 0)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700 w-10 text-right">
                          {subject.finalScore?.toFixed(1) || '—'}
                        </span>
                        <span
                          className={`badge text-xs font-bold w-8 text-center ${
                            subject.gradeLetter === 'A'
                              ? 'bg-green-100 text-green-800'
                              : subject.gradeLetter === 'B'
                              ? 'bg-blue-100 text-blue-800'
                              : subject.gradeLetter === 'C'
                              ? 'bg-amber-100 text-amber-800'
                              : subject.gradeLetter === 'D'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {subject.gradeLetter || '—'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 bg-slate-50 rounded-xl text-center">
                  <p className="text-lg font-bold text-slate-900">
                    {previewCard.totalScore?.toFixed(1)}
                  </p>
                  <p className="text-xs text-slate-500">Average Score</p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl text-center">
                  <p className="text-lg font-bold text-green-700">{previewCard.passedSubjects}</p>
                  <p className="text-xs text-slate-500">Subjects Passed</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-xl text-center">
                  <p className="text-lg font-bold text-indigo-700">
                    {previewCard.attendancePercentage?.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-500">Attendance</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportCardsPage;
