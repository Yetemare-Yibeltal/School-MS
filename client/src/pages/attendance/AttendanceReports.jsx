// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// ATTENDANCE REPORT PAGE
// kat-school/client/src/pages/attendance/AttendanceReportPage.jsx
// ============================================

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const AttendanceReportPage = () => {
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [viewMode, setViewMode] = useState('section'); // section | student

  const { data: sectionsData } = useQuery({
    queryKey: ['sections', selectedGrade],
    queryFn: async () => {
      const res = await api.get(`/academic/sections?grade=${selectedGrade}`);
      return res.data.data.sections;
    },
    enabled: !!selectedGrade,
  });

  const { data: dashboardData } = useQuery({
    queryKey: ['attendance-dashboard'],
    queryFn: async () => {
      const res = await api.get('/attendance/dashboard');
      return res.data.data;
    },
  });

  const { data: sectionReport, isLoading: sectionLoading } = useQuery({
    queryKey: ['section-attendance-report', selectedSection, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate, endDate });
      const res = await api.get(`/attendance/section/${selectedSection}/report?${params}`);
      return res.data.data;
    },
    enabled: !!selectedSection,
  });

  const getAttendanceColor = (pct) => {
    if (pct >= 85) return 'text-green-700 bg-green-100';
    if (pct >= 75) return 'text-amber-700 bg-amber-100';
    return 'text-red-700 bg-red-100';
  };

  const ProgressBar = ({ value, max, colorClass }) => (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }}
        />
      </div>
      <span className="text-xs text-slate-500 w-8 text-right">
        {max > 0 ? Math.round((value / max) * 100) : 0}%
      </span>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance Reports</h1>
          <p className="page-subtitle">Analyze attendance patterns and generate reports</p>
        </div>
      </div>

      {/* Dashboard Stats */}
      {dashboardData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            {
              label: 'Today Present',
              value: dashboardData.today?.present || 0,
              color: 'bg-green-50 border-green-200 text-green-800',
            },
            {
              label: 'Today Absent',
              value: dashboardData.today?.absent || 0,
              color: 'bg-red-50 border-red-200 text-red-800',
            },
            {
              label: 'Today Late',
              value: dashboardData.today?.late || 0,
              color: 'bg-amber-50 border-amber-200 text-amber-800',
            },
            {
              label: 'Total Today',
              value: dashboardData.today?.total || 0,
              color: 'bg-slate-50 border-slate-200 text-slate-700',
            },
            {
              label: 'Low Attendance',
              value: dashboardData.lowAttendanceStudents?.length || 0,
              color: 'bg-purple-50 border-purple-200 text-purple-800',
            },
          ].map((stat) => (
            <div key={stat.label} className={`p-3 rounded-xl border ${stat.color} text-center`}>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs font-medium mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          <div className="form-group mb-0">
            <label className="form-label text-xs">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={today}
              className="form-input"
            />
          </div>
          <div className="form-group mb-0">
            <label className="form-label text-xs">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              max={today}
              min={startDate}
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
              className="form-select w-32"
            >
              <option value="">All Grades</option>
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
              className="form-select w-36"
            >
              <option value="">Select section</option>
              {(sectionsData || []).map((s) => (
                <option key={s._id} value={s._id}>
                  Section {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section Report */}
      {selectedSection && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">
              Section Report — {selectedGrade} Section{' '}
              {(sectionsData || []).find((s) => s._id === selectedSection)?.name}
            </h3>
            <span className="text-xs text-slate-500">
              {new Date(startDate).toLocaleDateString('en-ET')} –{' '}
              {new Date(endDate).toLocaleDateString('en-ET')}
            </span>
          </div>

          {sectionLoading ? (
            <div className="p-8 text-center">
              <div className="spinner-lg mx-auto" />
            </div>
          ) : !sectionReport || (sectionReport.attendanceSummary || []).length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-slate-500">No attendance records for the selected period</p>
            </div>
          ) : (
            <div className="table-container rounded-none border-0">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Total Days</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Late</th>
                    <th>Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(sectionReport.attendanceSummary || [])
                    .sort((a, b) => (b.attendancePercentage || 0) - (a.attendancePercentage || 0))
                    .map((record, index) => {
                      const pct = Math.round(record.attendancePercentage || 0);
                      return (
                        <tr key={record._id} className="hover:bg-slate-50">
                          <td className="text-slate-400 text-xs">{index + 1}</td>
                          <td>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {record.studentName}
                              </p>
                              <p className="text-xs text-slate-400">{record.studentId}</p>
                            </div>
                          </td>
                          <td className="text-sm font-medium">{record.total}</td>
                          <td>
                            <span className="text-green-700 font-semibold text-sm">
                              {record.present}
                            </span>
                          </td>
                          <td>
                            <span className="text-red-600 font-semibold text-sm">
                              {record.absent}
                            </span>
                          </td>
                          <td>
                            <span className="text-amber-600 font-semibold text-sm">
                              {record.late}
                            </span>
                          </td>
                          <td className="w-40">
                            <div className="flex items-center gap-2">
                              <ProgressBar
                                value={record.present}
                                max={record.total}
                                colorClass={
                                  pct >= 85
                                    ? 'bg-green-500'
                                    : pct >= 75
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                                }
                              />
                              <span
                                className={`badge text-xs px-2 py-0.5 rounded-full font-semibold ${getAttendanceColor(
                                  pct
                                )}`}
                              >
                                {pct}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Low Attendance Alert */}
      {dashboardData?.lowAttendanceStudents?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-red-700">
              ⚠️ Students with High Absence Rate (&gt;25%)
            </h3>
            <span className="badge badge-danger text-xs">
              {dashboardData.lowAttendanceStudents.length} students
            </span>
          </div>
          <div className="table-container rounded-none border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Grade</th>
                  <th>Total Absences</th>
                  <th>Absence Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashboardData.lowAttendanceStudents.map((s) => (
                  <tr key={s._id} className="hover:bg-red-50">
                    <td>
                      <p className="text-sm font-medium text-slate-900">{s.studentName}</p>
                      <p className="text-xs text-slate-400">{s.studentId}</p>
                    </td>
                    <td>
                      <span className="badge badge-primary text-xs">{s.grade}</span>
                    </td>
                    <td>
                      <span className="text-red-600 font-semibold">{s.totalAbsent}</span>
                    </td>
                    <td>
                      <span
                        className={`badge text-xs font-semibold ${getAttendanceColor(
                          100 - s.absenceRate
                        )}`}
                      >
                        {Math.round(s.absenceRate)}% absent
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Weekly Trend */}
      {dashboardData?.weeklyTrend?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">7-Day Attendance Trend</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {dashboardData.weeklyTrend.map((day) => {
                const pct = day.total > 0 ? Math.round((day.present / day.total) * 100) : 0;
                return (
                  <div key={day._id} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-20 flex-shrink-0">
                      {new Date(day._id).toLocaleDateString('en-ET', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 85 ? 'bg-green-500' : pct >= 75 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 text-xs">
                      <span className="text-green-600 font-medium">{day.present}P</span>
                      <span className="text-red-500">{day.absent}A</span>
                      <span className="text-slate-400 w-8">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceReportPage;
