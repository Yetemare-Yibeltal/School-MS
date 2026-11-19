import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';

const nameOf = (v, alt) => (v && typeof v === 'object' ? v.name : alt) || '-';
const studentName = (r) =>
  r.studentName ||
  (r.student && typeof r.student === 'object'
    ? `${r.student.firstName || ''} ${r.student.fatherName || ''}`.trim()
    : '-');

const ExamDetailPage = () => {
  const { id } = useParams();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['exam', id],
    queryFn: async () => (await api.get(`/exams/${id}`)).data.data,
  });
  const { data: res } = useQuery({
    queryKey: ['exam-results', id],
    queryFn: async () => (await api.get(`/exams/${id}/results?limit=200`)).data.data,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['exam', id] });
    qc.invalidateQueries({ queryKey: ['exam-results', id] });
  };
  const fail = (err) => toast.error(err.response?.data?.message || 'Request failed.');
  const publish = useMutation({
    mutationFn: () => api.post(`/exams/${id}/publish`),
    onSuccess: (r) => {
      toast.success(r.data.message);
      refresh();
    },
    onError: fail,
  });
  const setStatus = useMutation({
    mutationFn: (status) => api.patch(`/exams/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Status updated.');
      refresh();
    },
    onError: fail,
  });

  if (isLoading) return <div className="card p-8 text-center text-slate-400">Loading...</div>;
  const exam = data?.exam;
  if (!exam) {
    return (
      <div className="card p-10 text-center">
        <p className="text-slate-500">Exam not found.</p>
        <Link to="/exams" className="btn-primary mt-4 inline-flex">
          Back to exams
        </Link>
      </div>
    );
  }

  const results = res?.results || [];
  const stats = res?.stats || data?.resultStats || {};

  return (
    <div className="space-y-5">
      <div className="text-sm text-slate-500">
        <Link to="/exams">Exams</Link> / <b className="text-slate-900">{exam.title}</b>
      </div>

      <div className="card p-6 flex flex-wrap gap-4 justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{exam.title}</h2>
          <p className="text-sm text-slate-500 mt-1">
            {nameOf(exam.subject, exam.subjectName)} · {exam.grade} ·{' '}
            {exam.startDate ? new Date(exam.startDate).toLocaleDateString('en-GB') : '-'}
          </p>
          <p className="text-sm mt-1">
            Total {exam.totalMarks}, pass {exam.passingMarks} ·{' '}
            <span className="capitalize">{exam.status}</span>
          </p>
        </div>
        <div className="flex gap-2 items-start flex-wrap">
          {exam.status === 'scheduled' && (
            <button
              type="button"
              className="btn-outline"
              onClick={() => setStatus.mutate('ongoing')}
            >
              Start exam
            </button>
          )}
          {exam.status === 'ongoing' && (
            <button
              type="button"
              className="btn-outline"
              onClick={() => setStatus.mutate('completed')}
            >
              Mark completed
            </button>
          )}
          <Link to={`/exams/${id}/results`} className="btn-primary">
            Enter results
          </Link>
          {results.length > 0 && (
            <button
              type="button"
              className="btn-success"
              disabled={publish.isPending}
              onClick={() => window.confirm('Publish all results?') && publish.mutate()}
            >
              Publish results
            </button>
          )}
        </div>
      </div>

      {Object.keys(stats).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {Object.entries(stats)
            .filter(([, v]) => typeof v !== 'object')
            .map(([k, v]) => (
              <div key={k} className="card p-3 text-center">
                <p className="text-lg font-bold text-slate-900">
                  {typeof v === 'number' ? Math.round(v * 10) / 10 : String(v)}
                </p>
                <p className="text-xs text-slate-500">{k}</p>
              </div>
            ))}
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Student</th>
              <th>Marks</th>
              <th>Grade</th>
              <th>Result</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {results.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500">
                  No results entered yet.
                </td>
              </tr>
            )}
            {results.map((r, i) => (
              <tr key={r._id || i}>
                <td>{r.rank || i + 1}</td>
                <td>{studentName(r)}</td>
                <td>{r.isAbsent ? 'Absent' : `${r.marksObtained}/${exam.totalMarks}`}</td>
                <td>{r.gradeLetter || '-'}</td>
                <td>{r.isAbsent ? '-' : r.isPassed ? 'Passed' : 'Failed'}</td>
                <td className="capitalize">{r.status || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExamDetailPage;
