import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const iso = (d) => d.toISOString().split('T')[0];
const person = (x) =>
  x.studentName ||
  (x.student && typeof x.student === 'object'
    ? `${x.student.firstName || ''} ${x.student.fatherName || ''}`.trim()
    : '') ||
  '-';

const AttendanceReportPage = () => {
  const now = new Date();
  const [start, setStart] = useState(iso(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [end, setEnd] = useState(iso(now));
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');

  const { data: dash } = useQuery({
    queryKey: ['att-dashboard'],
    queryFn: async () => (await api.get('/attendance/dashboard')).data.data,
  });
  const { data: sections = [] } = useQuery({
    queryKey: ['sections', grade],
    queryFn: async () => (await api.get(`/academic/sections?grade=${grade}`)).data.data.sections,
    enabled: !!grade,
  });
  const { data: report, isLoading } = useQuery({
    queryKey: ['att-section-report', section, start, end],
    queryFn: async () =>
      (await api.get(`/attendance/section/${section}/report?startDate=${start}&endDate=${end}`))
        .data.data.attendanceSummary,
    enabled: !!section,
  });

  const today = dash?.today || {};
  const trend = Array.isArray(dash?.weeklyTrend) ? dash.weeklyTrend : [];
  const low = Array.isArray(dash?.lowAttendanceStudents) ? dash.lowAttendanceStudents : [];
  const rows = Array.isArray(report) ? report : [];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance Reports</h1>
          <p className="page-subtitle">Today and by section</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {['present', 'absent', 'late', 'excused', 'total'].map((k) => (
          <div key={k} className="card p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{today[k] ?? 0}</p>
            <p className="text-xs text-slate-500 capitalize">{k} today</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Weekly trend</h3>
          </div>
          <div className="card-body space-y-1 text-sm">
            {trend.length === 0 && <p className="text-slate-400">No data.</p>}
            {trend.map((t, i) => (
              <div key={t._id || t.date || i} className="flex justify-between">
                <span>{t._id || t.date || '-'}</span>
                <span>
                  P {t.present ?? 0} / A {t.absent ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Low attendance students</h3>
          </div>
          <div className="card-body space-y-1 text-sm">
            {low.length === 0 && <p className="text-slate-400">None.</p>}
            {low.map((s, i) => (
              <div key={s._id || i} className="flex justify-between">
                <span>{person(s)}</span>
                <span className="text-red-600">
                  {s.attendancePercentage != null
                    ? `${Math.round(s.attendancePercentage)}%`
                    : s.totalAbsent ?? ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <input
          type="date"
          className="form-input"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
        <input
          type="date"
          className="form-input"
          value={end}
          min={start}
          onChange={(e) => setEnd(e.target.value)}
        />
        <select
          className="form-select"
          value={grade}
          onChange={(e) => {
            setGrade(e.target.value);
            setSection('');
          }}
        >
          <option value="">Grade</option>
          {GRADES.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
        <select
          className="form-select"
          value={section}
          disabled={!grade}
          onChange={(e) => setSection(e.target.value)}
        >
          <option value="">Section</option>
          {sections.map((s) => (
            <option key={s._id} value={s._id}>
              Section {s.name}
            </option>
          ))}
        </select>
      </div>

      {section && (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Total</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Late</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No records for this period.
                  </td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr key={r._id || i}>
                  <td>{person(r)}</td>
                  <td>{r.total ?? r.totalDays ?? '-'}</td>
                  <td>{r.present ?? 0}</td>
                  <td>{r.absent ?? 0}</td>
                  <td>{r.late ?? 0}</td>
                  <td>
                    {r.attendancePercentage != null
                      ? `${Math.round(r.attendancePercentage)}%`
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceReportPage;
