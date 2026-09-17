// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// ATTENDANCE PAGE
// kat-school/client/src/pages/attendance/AttendancePage.jsx
// ============================================

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const ATTENDANCE_STATUSES = [
  {
    value: 'present',
    label: 'Present',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bg: 'bg-green-50 border-green-300',
  },
  {
    value: 'absent',
    label: 'Absent',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bg: 'bg-red-50 border-red-300',
  },
  {
    value: 'late',
    label: 'Late',
    color: 'bg-amber-500',
    textColor: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-300',
  },
  {
    value: 'excused',
    label: 'Excused',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-300',
  },
];

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const AttendancePage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [attendanceMap, setAttendanceMap] = useState({});
  const [remarksMap, setRemarksMap] = useState({});
  const [notifyParents, setNotifyParents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: sectionsData } = useQuery({
    queryKey: ['sections', selectedGrade],
    queryFn: async () => {
      const res = await api.get(`/academic/sections?grade=${selectedGrade}`);
      return res.data.data.sections;
    },
    enabled: !!selectedGrade,
  });

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-for-attendance', selectedSection],
    queryFn: async () => {
      const res = await api.get(`/students?section=${selectedSection}&status=active&limit=100`);
      return res.data.data.students;
    },
    enabled: !!selectedSection,
  });

  const { data: existingAttendance, isLoading: attLoading } = useQuery({
    queryKey: ['attendance-by-date', selectedDate, selectedSection],
    queryFn: async () => {
      const res = await api.get(
        `/attendance/by-date?date=${selectedDate}&section=${selectedSection}`
      );
      return res.data.data;
    },
    enabled: !!selectedSection && !!selectedDate,
  });

  // Populate existing attendance
  useEffect(() => {
    if (existingAttendance?.attendanceMap) {
      const map = {};
      const rmarks = {};
      Object.entries(existingAttendance.attendanceMap).forEach(([studentId, att]) => {
        map[studentId] = att.status;
        if (att.remarks) rmarks[studentId] = att.remarks;
      });
      setAttendanceMap(map);
      setRemarksMap(rmarks);
      setSubmitted(Object.keys(map).length > 0);
    } else {
      setAttendanceMap({});
      setRemarksMap({});
      setSubmitted(false);
    }
  }, [existingAttendance, selectedSection, selectedDate]);

  const students = studentsData || [];

  const setAllStatus = (status) => {
    const map = {};
    students.forEach((s) => {
      map[s._id] = status;
    });
    setAttendanceMap(map);
  };

  const setStudentStatus = (studentId, status) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const getStatusConfig = (status) => ATTENDANCE_STATUSES.find((s) => s.value === status);

  const handleSubmit = async () => {
    if (!selectedSection || !selectedDate) {
      toast.error('Please select a section and date.');
      return;
    }

    if (Object.keys(attendanceMap).length === 0) {
      toast.error('Please mark attendance for at least one student.');
      return;
    }

    const currentYear = await api.get('/academic/years/current');
    const academicYearId = currentYear.data.data.academicYear?._id;

    const attendances = students.map((student) => ({
      student: student._id,
      status: attendanceMap[student._id] || 'present',
      remarks: remarksMap[student._id] || undefined,
      lateMinutes: attendanceMap[student._id] === 'late' ? 15 : 0,
    }));

    setSubmitting(true);
    try {
      await api.post('/attendance/bulk-mark', {
        date: selectedDate,
        section: selectedSection,
        grade: selectedGrade,
        academicYear: academicYearId,
        attendances,
        notifyParents,
      });

      toast.success(`Attendance saved for ${students.length} students!`);
      setSubmitted(true);
      queryClient.invalidateQueries({
        queryKey: ['attendance-by-date', selectedDate, selectedSection],
      });
      queryClient.invalidateQueries({ queryKey: ['attendance-dashboard'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  const summary = {
    present: Object.values(attendanceMap).filter((s) => s === 'present').length,
    absent: Object.values(attendanceMap).filter((s) => s === 'absent').length,
    late: Object.values(attendanceMap).filter((s) => s === 'late').length,
    excused: Object.values(attendanceMap).filter((s) => s === 'excused').length,
    unmarked: students.length - Object.keys(attendanceMap).length,
  };

  const isToday = selectedDate === today;
  const isFuture = selectedDate > today;
  const canEdit = !isFuture && ['super_admin', 'admin', 'teacher'].includes(user?.role);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mark Attendance</h1>
          <p className="page-subtitle">Record daily student attendance</p>
        </div>
        {submitted && (
          <span className="badge badge-success text-sm px-3 py-1.5">✓ Attendance Saved</span>
        )}
      </div>

      {/* Selection Panel */}
      <div className="card p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="form-group mb-0">
            <label className="form-label text-xs">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSubmitted(false);
              }}
              max={today}
              className="form-input"
            />
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
            <label className="form-label text-xs">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={!selectedGrade}
              className="form-select"
            >
              <option value="">Select section</option>
              {(sectionsData || []).map((s) => (
                <option key={s._id} value={s._id}>
                  Section {s.name} ({s.currentEnrollment})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group mb-0 flex items-end">
            {selectedSection && students.length > 0 && canEdit && (
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => setAllStatus('present')}
                  className="btn-success btn-sm flex-1"
                >
                  ✓ All Present
                </button>
                <button onClick={() => setAllStatus('absent')} className="btn-danger btn-sm flex-1">
                  ✗ All Absent
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Future date warning */}
      {isFuture && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          ⚠️ Cannot mark attendance for future dates.
        </div>
      )}

      {/* Stats Summary */}
      {selectedSection && students.length > 0 && (
        <div className="grid grid-cols-5 gap-3">
          {[
            {
              label: 'Present',
              value: summary.present,
              color: 'bg-green-50 border-green-200 text-green-800',
            },
            {
              label: 'Absent',
              value: summary.absent,
              color: 'bg-red-50 border-red-200 text-red-800',
            },
            {
              label: 'Late',
              value: summary.late,
              color: 'bg-amber-50 border-amber-200 text-amber-800',
            },
            {
              label: 'Excused',
              value: summary.excused,
              color: 'bg-blue-50 border-blue-200 text-blue-800',
            },
            {
              label: 'Unmarked',
              value: summary.unmarked,
              color: 'bg-slate-50 border-slate-200 text-slate-700',
            },
          ].map((stat) => (
            <div key={stat.label} className={`p-3 rounded-xl border text-center ${stat.color}`}>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs font-medium mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Students List */}
      {!selectedSection ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-slate-500 font-medium">
            Select a grade and section to mark attendance
          </p>
        </div>
      ) : studentsLoading || attLoading ? (
        <div className="card p-8">
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 bg-slate-100 rounded-full" />
                <div className="flex-1 h-4 bg-slate-100 rounded" />
                <div className="flex gap-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="w-20 h-9 bg-slate-100 rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : students.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">👨‍🎓</div>
          <p className="text-slate-500">No active students in this section</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="card-header">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {selectedGrade} — Section{' '}
                {(sectionsData || []).find((s) => s._id === selectedSection)?.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {students.length} students &bull;{' '}
                {new Date(selectedDate).toLocaleDateString('en-ET', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {students.map((student, index) => {
              const currentStatus = attendanceMap[student._id];
              const statusConfig = getStatusConfig(currentStatus);

              return (
                <div
                  key={student._id}
                  className={`flex items-center gap-3 px-5 py-3 hover:bg-slate-50 ${
                    currentStatus === 'absent' ? 'bg-red-50/30' : ''
                  }`}
                >
                  {/* Index + Avatar */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xs text-slate-400 w-6 text-right">{index + 1}</span>
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
                      <p className="text-xs text-slate-400">{student.studentId}</p>
                    </div>
                  </div>

                  {/* Status Buttons */}
                  {canEdit ? (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {ATTENDANCE_STATUSES.map((status) => (
                        <button
                          key={status.value}
                          onClick={() => setStudentStatus(student._id, status.value)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            currentStatus === status.value
                              ? `${status.bg} border-2 font-semibold shadow-sm`
                              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-shrink-0">
                      {currentStatus ? (
                        <span
                          className={`badge text-xs capitalize ${
                            currentStatus === 'present'
                              ? 'badge-success'
                              : currentStatus === 'absent'
                              ? 'badge-danger'
                              : currentStatus === 'late'
                              ? 'badge-warning'
                              : 'badge-info'
                          }`}
                        >
                          {currentStatus}
                        </span>
                      ) : (
                        <span className="badge badge-gray text-xs">—</span>
                      )}
                    </div>
                  )}

                  {/* Remarks for absent */}
                  {canEdit && currentStatus === 'absent' && (
                    <input
                      type="text"
                      value={remarksMap[student._id] || ''}
                      onChange={(e) =>
                        setRemarksMap((prev) => ({ ...prev, [student._id]: e.target.value }))
                      }
                      placeholder="Reason..."
                      className="form-input text-xs w-32 py-1.5 flex-shrink-0"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit Footer */}
          {canEdit && (
            <div className="card-footer flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyParents}
                    onChange={(e) => setNotifyParents(e.target.checked)}
                    className="form-checkbox"
                  />
                  <span className="text-sm text-slate-600">Notify parents of absent students</span>
                </label>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || summary.unmarked === students.length}
                className="btn-primary"
              >
                {submitting ? (
                  <>
                    <div className="spinner-sm" /> Saving...
                  </>
                ) : submitted ? (
                  '✓ Update Attendance'
                ) : (
                  `Save Attendance (${students.length - summary.unmarked}/${students.length})`
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
