import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const STATUSES = ['present', 'absent', 'late', 'excused'];
const today = () => new Date().toISOString().split('T')[0];

const AttendancePage = () => {
  const qc = useQueryClient();
  const [date, setDate] = useState(today());
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [marks, setMarks] = useState({});
  const [remarks, setRemarks] = useState({});
  const [notify, setNotify] = useState(false);

  const { data: sections = [] } = useQuery({
    queryKey: ['sections', grade],
    queryFn: async () => (await api.get(`/academic/sections?grade=${grade}`)).data.data.sections,
    enabled: !!grade,
  });
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['att-students', section],
    queryFn: async () =>
      (await api.get(`/students?section=${section}&status=active&limit=100`)).data.data.students,
    enabled: !!section,
  });
  const { data: existing } = useQuery({
    queryKey: ['att-by-date', date, section],
    queryFn: async () =>
      (await api.get(`/attendance/by-date?date=${date}&section=${section}&grade=${grade}`)).data
        .data,
    enabled: !!section,
  });
  const { data: year } = useQuery({
    queryKey: ['current-year'],
    queryFn: async () => (await api.get('/academic/years/current')).data.data.academicYear,
  });
  const { data: term } = useQuery({
    queryKey: ['current-term'],
    queryFn: async () => {
      try {
        return (await api.get('/academic/terms/current')).data.data.term;
      } catch {
        return null;
      }
    },
  });

  const saved = existing?.attendanceMap || {};
  const statusOf = (id) => {
    if (marks[id]) return marks[id];
    const v = saved[id];
    return (typeof v === 'string' ? v : v?.status) || 'present';
  };
  const remarkOf = (id) => remarks[id] ?? saved[id]?.remarks ?? '';

  const save = useMutation({
    mutationFn: (payload) => api.post('/attendance/bulk-mark', payload),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Attendance saved.');
      setMarks({});
      qc.invalidateQueries({ queryKey: ['att-by-date'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not save attendance.'),
  });

  const submit = () => {
    if (!year?._id) {
      toast.error('No current academic year is set.');
      return;
    }
    save.mutate({
      date,
      section,
      grade,
      academicYear: year._id,
      term: term?._id,
      notifyParents: notify,
      attendances: students.map((s) => {
        const status = statusOf(s._id);
        return {
          student: s._id,
          status,
          remarks: remarkOf(s._id) || undefined,
          lateMinutes: status === 'late' ? 15 : 0,
        };
      }),
    });
  };

  const setAll = (status) => setMarks(Object.fromEntries(students.map((s) => [s._id, status])));
  const counts = STATUSES.map((st) => [st, students.filter((s) => statusOf(s._id) === st).length]);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mark Attendance</h1>
          <p className="page-subtitle">Daily student attendance</p>
        </div>
        <Link to="/attendance/report" className="btn-outline">
          Reports
        </Link>
      </div>

      <div className="card p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="date"
          max={today()}
          className="form-input"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setMarks({});
          }}
        />
        <select
          className="form-select"
          value={grade}
          onChange={(e) => {
            setGrade(e.target.value);
            setSection('');
            setMarks({});
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
          onChange={(e) => {
            setSection(e.target.value);
            setMarks({});
          }}
        >
          <option value="">Section</option>
          {sections.map((s) => (
            <option key={s._id} value={s._id}>
              Section {s.name}
            </option>
          ))}
        </select>
      </div>

      {!section && (
        <div className="card p-12 text-center text-slate-500">Select a grade and section.</div>
      )}
      {section && isLoading && (
        <div className="card p-8 text-center text-slate-400">Loading...</div>
      )}
      {section && !isLoading && students.length === 0 && (
        <div className="card p-12 text-center text-slate-500">
          No active students in this section.
        </div>
      )}

      {students.length > 0 && (
        <div className="card">
          <div className="card-header flex-wrap gap-2">
            <div className="flex gap-4 text-sm">
              {counts.map(([st, n]) => (
                <span key={st} className="capitalize">
                  {st}: <b>{n}</b>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-success btn-sm"
                onClick={() => setAll('present')}
              >
                All present
              </button>
              <button type="button" className="btn-danger btn-sm" onClick={() => setAll('absent')}>
                All absent
              </button>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {students.map((s, i) => (
              <div key={s._id} className="flex items-center gap-3 px-5 py-3 flex-wrap">
                <span className="w-6 text-xs text-slate-400">{i + 1}</span>
                <div className="flex-1 min-w-[160px]">
                  <p className="text-sm font-medium text-slate-900">
                    {s.firstName} {s.fatherName}
                  </p>
                  <p className="text-xs text-slate-400">{s.studentId}</p>
                </div>
                <div className="flex gap-1">
                  {STATUSES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setMarks((p) => ({ ...p, [s._id]: st }))}
                      className={`px-2.5 py-1.5 rounded-lg text-xs border capitalize ${
                        statusOf(s._id) === st
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white border-slate-300'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                {statusOf(s._id) !== 'present' && (
                  <input
                    className="form-input w-40 py-1.5 text-xs"
                    placeholder="Remarks"
                    value={remarkOf(s._id)}
                    onChange={(e) => setRemarks((p) => ({ ...p, [s._id]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="card-footer flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
              />
              Notify parents of absences
            </label>
            <button
              type="button"
              disabled={save.isPending}
              className="btn-primary"
              onClick={submit}
            >
              {save.isPending ? 'Saving...' : 'Save attendance'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
