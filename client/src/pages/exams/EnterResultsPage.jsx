import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';

const idOf = (v) => (v && typeof v === 'object' ? v._id : v);

const EnterResultsPage = () => {
  const { id } = useParams();
  const qc = useQueryClient();
  const [marks, setMarks] = useState({});
  const [absent, setAbsent] = useState({});

  const { data: exam } = useQuery({
    queryKey: ['exam', id],
    queryFn: async () => (await api.get(`/exams/${id}`)).data.data.exam,
  });
  const { data: students = [] } = useQuery({
    queryKey: ['exam-students', id, exam?.grade],
    queryFn: async () => {
      const q = new URLSearchParams({ grade: exam.grade, status: 'active', limit: 200 });
      if (exam.section) q.set('section', idOf(exam.section));
      return (await api.get(`/students?${q}`)).data.data.students;
    },
    enabled: !!exam,
  });
  const { data: existing = [] } = useQuery({
    queryKey: ['exam-results-existing', id],
    queryFn: async () => (await api.get(`/exams/${id}/results?limit=200`)).data.data.results || [],
  });

  const saved = Object.fromEntries(existing.map((r) => [idOf(r.student), r]));
  const markOf = (sid) =>
    marks[sid] ?? (saved[sid] && !saved[sid].isAbsent ? String(saved[sid].marksObtained) : '');
  const absentOf = (sid) => absent[sid] ?? Boolean(saved[sid]?.isAbsent);

  const save = useMutation({
    mutationFn: (payload) => api.post('/exams/results/bulk', payload),
    onSuccess: (res) => {
      toast.success(res.data.message);
      setMarks({});
      setAbsent({});
      qc.invalidateQueries({ queryKey: ['exam-results-existing', id] });
      qc.invalidateQueries({ queryKey: ['exam-results', id] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not save results.'),
  });

  if (!exam) return <div className="card p-8 text-center text-slate-400">Loading...</div>;

  const submit = () => {
    const results = [];
    for (const s of students) {
      const isAbsent = absentOf(s._id);
      const raw = markOf(s._id);
      if (!isAbsent && raw === '') continue;
      const value = isAbsent ? 0 : parseFloat(raw);
      if (!isAbsent && (Number.isNaN(value) || value < 0 || value > exam.totalMarks)) {
        toast.error(`Invalid marks for ${s.firstName} ${s.fatherName} (0 to ${exam.totalMarks}).`);
        return;
      }
      results.push({ student: s._id, marksObtained: value, isAbsent });
    }
    if (results.length === 0) {
      toast.error('Enter marks for at least one student.');
      return;
    }
    save.mutate({ exam: id, results });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="text-sm text-slate-500">
        <Link to="/exams">Exams</Link> / <Link to={`/exams/${id}`}>{exam.title}</Link> /{' '}
        <b className="text-slate-900">Enter results</b>
      </div>
      <div className="card p-5 flex justify-between">
        <div>
          <h2 className="font-bold text-slate-900">{exam.title}</h2>
          <p className="text-sm text-slate-500">{exam.grade}</p>
        </div>
        <p className="text-sm text-right">
          Total <b>{exam.totalMarks}</b>
          <br />
          Pass <b>{exam.passingMarks}</b>
        </p>
      </div>

      <div className="card divide-y divide-slate-100">
        {students.length === 0 && (
          <p className="p-10 text-center text-slate-500">No active students for this exam.</p>
        )}
        {students.map((s, i) => (
          <div key={s._id} className="flex items-center gap-3 px-5 py-3">
            <span className="w-6 text-xs text-slate-400">{i + 1}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">
                {s.firstName} {s.fatherName}
              </p>
              <p className="text-xs text-slate-400">{s.studentId}</p>
            </div>
            <input
              type="number"
              min="0"
              max={exam.totalMarks}
              step="0.5"
              disabled={absentOf(s._id)}
              className="form-input w-28 py-1.5 text-center"
              value={markOf(s._id)}
              onChange={(e) => setMarks((p) => ({ ...p, [s._id]: e.target.value }))}
            />
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={absentOf(s._id)}
                onChange={(e) => setAbsent((p) => ({ ...p, [s._id]: e.target.checked }))}
              />
              Absent
            </label>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <Link to={`/exams/${id}`} className="btn-outline">
          Back
        </Link>
        <button type="button" className="btn-primary" disabled={save.isPending} onClick={submit}>
          {save.isPending ? 'Saving...' : 'Save results'}
        </button>
      </div>
    </div>
  );
};

export default EnterResultsPage;
