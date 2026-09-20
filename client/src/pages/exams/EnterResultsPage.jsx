// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// ENTER RESULTS PAGE
// kat-school/client/src/pages/exams/EnterResultsPage.jsx
// ============================================

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const EnterResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [resultsMap, setResultsMap] = useState({});
  const [absentMap, setAbsentMap] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: examData, isLoading: examLoading } = useQuery({
    queryKey: ['exam', id],
    queryFn: async () => {
      const res = await api.get(`/exams/${id}`);
      return res.data.data;
    },
  });

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-for-exam', examData?.exam?.grade, examData?.exam?.section],
    queryFn: async () => {
      const filter = {
        status: 'active',
        grade: examData.exam.grade,
        limit: 100,
      };
      if (examData.exam.section) filter.section = examData.exam.section;
      const params = new URLSearchParams(filter);
      const res = await api.get(`/students?${params}`);
      return res.data.data.students;
    },
    enabled: !!examData?.exam?.grade,
  });

  const { data: existingResultsData } = useQuery({
    queryKey: ['existing-results', id],
    queryFn: async () => {
      const res = await api.get(`/exams/${id}/results?limit=200`);
      return res.data.data.results;
    },
  });

  // Populate existing results
  useEffect(() => {
    if (existingResultsData?.length > 0) {
      const marks = {};
      const absent = {};
      existingResultsData.forEach((r) => {
        const sid = r.student?._id || r.student;
        if (sid) {
          marks[sid] = r.isAbsent ? '' : String(r.marksObtained);
          absent[sid] = r.isAbsent || false;
        }
      });
      setResultsMap(marks);
      setAbsentMap(absent);
      setSaved(existingResultsData.length > 0);
    }
  }, [existingResultsData]);

  const bulkSaveMutation = useMutation({
    mutationFn: (data) => api.post('/exams/results/bulk', data),
    onSuccess: (res) => {
      toast.success(`${res.data.data.saved} results saved!`);
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['exam', id] });
      queryClient.invalidateQueries({ queryKey: ['existing-results', id] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed.'),
  });

  const publishMutation = useMutation({
    mutationFn: () => api.post(`/exams/${id}/publish`),
    onSuccess: () => {
      toast.success('Results published! Students have been notified.');
      queryClient.invalidateQueries({ queryKey: ['exam', id] });
      navigate(`/exams/${id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Publish failed.'),
  });

  const handleSave = async () => {
    const students = studentsData || [];
    if (students.length === 0) {
      toast.error('No students to save results for.');
      return;
    }

    const exam = examData?.exam;
    const results = students.map((student) => {
      const isAbsent = absentMap[student._id] || false;
      const marks = isAbsent ? 0 : parseFloat(resultsMap[student._id] || 0);
      return {
        student: student._id,
        marksObtained: marks,
        isAbsent,
        isExcused: false,
      };
    });

    setSubmitting(true);
    try {
      await bulkSaveMutation.mutateAsync({ exam: id, results });
    } finally {
      setSubmitting(false);
    }
  };

  if (examLoading || studentsLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 bg-slate-100 rounded w-64" />
        <div className="card p-6">
          <div className="h-64 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  const exam = examData?.exam;
  const students = studentsData || [];

  if (!exam) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Exam not found.</p>
        <Link to="/exams" className="btn-primary mt-4 inline-flex">
          Back to Exams
        </Link>
      </div>
    );
  }

  const enteredCount = Object.keys(resultsMap).filter(
    (sid) => resultsMap[sid] !== '' || absentMap[sid]
  ).length;
  const absentCount = Object.values(absentMap).filter(Boolean).length;

  const getGradeForMark = (mark, total) => {
    if (!mark && mark !== 0) return null;
    const pct = (parseFloat(mark) / total) * 100;
    if (pct >= 85) return { letter: 'A', color: 'text-green-600' };
    if (pct >= 75) return { letter: 'B', color: 'text-blue-600' };
    if (pct >= 65) return { letter: 'C', color: 'text-amber-600' };
    if (pct >= 50) return { letter: 'D', color: 'text-orange-600' };
    return { letter: 'F', color: 'text-red-600' };
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/exams" className="hover:text-slate-700">
          Exams
        </Link>
        <span>/</span>
        <Link to={`/exams/${id}`} className="hover:text-slate-700 truncate max-w-[200px]">
          {exam.title}
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">Enter Results</span>
      </div>

      {/* Exam Info */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{exam.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge badge-primary">{exam.subjectName}</span>
              <span className="badge badge-gray">{exam.grade}</span>
              {exam.sectionName && (
                <span className="badge badge-gray">Section {exam.sectionName}</span>
              )}
              <span className="badge badge-info">{exam.examTypeName}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Total Marks</p>
            <p className="text-2xl font-bold text-slate-900">{exam.totalMarks}</p>
            <p className="text-xs text-slate-400">Pass: {exam.passingMarks}</p>
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Students', value: students.length },
          { label: 'Results Entered', value: enteredCount },
          { label: 'Absent', value: absentCount },
          { label: 'Pending', value: students.length - enteredCount },
        ].map((stat) => (
          <div key={stat.label} className="card p-3 text-center">
            <p className="text-xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Results Entry */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h3 className="text-sm font-semibold">Enter Student Results</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newAbsent = {};
                students.forEach((s) => {
                  newAbsent[s._id] = true;
                });
                setAbsentMap(newAbsent);
                setResultsMap({});
              }}
              className="btn-ghost text-xs text-red-600"
            >
              Mark All Absent
            </button>
            <button
              onClick={() => {
                setAbsentMap({});
              }}
              className="btn-ghost text-xs text-green-600"
            >
              Clear All Absences
            </button>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">👨‍🎓</div>
            <p className="text-slate-500">No students found for this exam criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {students.map((student, index) => {
              const isAbsent = absentMap[student._id] || false;
              const mark = resultsMap[student._id] || '';
              const grade =
                !isAbsent && mark !== '' ? getGradeForMark(mark, exam.totalMarks) : null;
              const markNum = parseFloat(mark);
              const isValidMark = !isNaN(markNum) && markNum >= 0 && markNum <= exam.totalMarks;
              const isInvalidInput = mark !== '' && !isValidMark;

              return (
                <div
                  key={student._id}
                  className={`flex items-center gap-4 px-5 py-3 transition-colors ${
                    isAbsent ? 'bg-red-50/30' : ''
                  }`}
                >
                  {/* Index */}
                  <span className="text-xs text-slate-400 w-6 text-right flex-shrink-0">
                    {index + 1}
                  </span>

                  {/* Avatar */}
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

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {student.firstName} {student.fatherName} {student.grandFatherName || ''}
                    </p>
                    <p className="text-xs text-slate-400">{student.studentId}</p>
                  </div>

                  {/* Mark Input */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {!isAbsent ? (
                      <div className="relative">
                        <input
                          type="number"
                          value={mark}
                          onChange={(e) => {
                            const val = e.target.value;
                            setResultsMap((prev) => ({ ...prev, [student._id]: val }));
                          }}
                          min={0}
                          max={exam.totalMarks}
                          step={0.5}
                          placeholder="0"
                          className={`w-24 text-center form-input py-1.5 text-sm ${
                            isInvalidInput ? 'border-red-400 bg-red-50' : ''
                          }`}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                          /{exam.totalMarks}
                        </span>
                      </div>
                    ) : (
                      <div className="w-24 h-9 flex items-center justify-center bg-red-100 rounded-lg border border-red-200">
                        <span className="text-xs text-red-600 font-medium">Absent</span>
                      </div>
                    )}

                    {/* Grade Preview */}
                    {grade && (
                      <span className={`text-sm font-bold w-5 ${grade.color}`}>{grade.letter}</span>
                    )}
                    {isAbsent && <span className="text-sm text-slate-300 w-5">—</span>}

                    {/* Absent Toggle */}
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAbsent}
                        onChange={(e) => {
                          setAbsentMap((prev) => ({ ...prev, [student._id]: e.target.checked }));
                          if (e.target.checked) {
                            setResultsMap((prev) => ({ ...prev, [student._id]: '' }));
                          }
                        }}
                        className="form-checkbox"
                      />
                      <span className="text-xs text-slate-500">Absent</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="card-footer flex items-center justify-between">
          <div className="text-sm text-slate-500">
            {enteredCount}/{students.length} results entered
            {saved && <span className="ml-2 text-green-600 font-medium">✓ Saved</span>}
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/exams/${id}`} className="btn-outline">
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={submitting || students.length === 0}
              className="btn-primary"
            >
              {submitting ? (
                <>
                  <div className="spinner-sm" /> Saving...
                </>
              ) : (
                '💾 Save Results'
              )}
            </button>
            {saved && exam.status === 'completed' && (
              <button
                onClick={() => {
                  if (confirm('Publish results? Students will be notified.'))
                    publishMutation.mutate();
                }}
                disabled={publishMutation.isPending}
                className="btn-success"
              >
                {publishMutation.isPending ? <div className="spinner-sm" /> : '📢 Publish'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterResultsPage;
