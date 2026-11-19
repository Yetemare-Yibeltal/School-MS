import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const today = () => new Date().toISOString().split('T')[0];

const Field = ({ label, children }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    {children}
  </div>
);

const AddExamPage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [f, setF] = useState({
    title: '',
    examType: '',
    academicYear: '',
    term: '',
    grade: '',
    section: '',
    subject: '',
    startDate: today(),
    endDate: '',
    startTime: '08:00',
    endTime: '10:00',
    duration: '120',
    totalMarks: '100',
    passingMarks: '50',
    instructions: '',
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const { data: years = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => (await api.get('/academic/years')).data.data.academicYears,
  });
  const year = f.academicYear || years.find((y) => y.isCurrent)?._id || '';
  const { data: terms = [] } = useQuery({
    queryKey: ['terms', year],
    queryFn: async () => (await api.get(`/academic/terms?academicYear=${year}`)).data.data.terms,
    enabled: !!year,
  });
  const { data: types = [] } = useQuery({
    queryKey: ['exam-types'],
    queryFn: async () => (await api.get('/exams/types')).data.data.examTypes,
  });
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects', f.grade],
    queryFn: async () => (await api.get(`/academic/subjects?grade=${f.grade}`)).data.data.subjects,
    enabled: !!f.grade,
  });
  const { data: sections = [] } = useQuery({
    queryKey: ['sections', f.grade],
    queryFn: async () => (await api.get(`/academic/sections?grade=${f.grade}`)).data.data.sections,
    enabled: !!f.grade,
  });

  const create = useMutation({
    mutationFn: (p) => api.post('/exams', p),
    onSuccess: (res) => {
      toast.success('Exam scheduled.');
      qc.invalidateQueries({ queryKey: ['exams'] });
      navigate(`/exams/${res.data.data.exam._id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not schedule exam.'),
  });

  const submit = (e) => {
    e.preventDefault();
    if (!f.title.trim() || !f.examType || !f.grade || !f.subject || !f.startDate) {
      toast.error('Title, exam type, grade, subject and date are required.');
      return;
    }
    const total = parseFloat(f.totalMarks) || 0;
    const pass = parseFloat(f.passingMarks) || 0;
    if (pass > total) {
      toast.error('Passing marks cannot exceed total marks.');
      return;
    }
    create.mutate({
      title: f.title.trim(),
      examType: f.examType,
      academicYear: year,
      term: f.term || undefined,
      grade: f.grade,
      section: f.section || undefined,
      subject: f.subject,
      startDate: f.startDate,
      endDate: f.endDate || f.startDate,
      startTime: f.startTime || undefined,
      endTime: f.endTime || undefined,
      duration: parseInt(f.duration, 10) || undefined,
      totalMarks: total,
      passingMarks: pass,
      instructions: f.instructions || undefined,
    });
  };

  return (
    <form onSubmit={submit} className="max-w-3xl mx-auto space-y-5">
      <div className="text-sm text-slate-500">
        <Link to="/exams">Exams</Link> / <b className="text-slate-900">Schedule exam</b>
      </div>
      <div className="card">
        <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <div className="md:col-span-2">
            <Field label="Title">
              <input
                className="form-input"
                value={f.title}
                onChange={set('title')}
                placeholder="Mid-Term Mathematics"
              />
            </Field>
          </div>
          <Field label="Exam type">
            <select className="form-select" value={f.examType} onChange={set('examType')}>
              <option value="">Select</option>
              {types.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Academic year">
            <select className="form-select" value={year} onChange={set('academicYear')}>
              {years.map((y) => (
                <option key={y._id} value={y._id}>
                  {y.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Term">
            <select className="form-select" value={f.term} onChange={set('term')}>
              <option value="">None</option>
              {terms.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Grade">
            <select
              className="form-select"
              value={f.grade}
              onChange={(e) =>
                setF((p) => ({ ...p, grade: e.target.value, subject: '', section: '' }))
              }
            >
              <option value="">Select</option>
              {GRADES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </Field>
          <Field label="Subject">
            <select
              className="form-select"
              value={f.subject}
              disabled={!f.grade}
              onChange={set('subject')}
            >
              <option value="">Select</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Section (optional)">
            <select
              className="form-select"
              value={f.section}
              disabled={!f.grade}
              onChange={set('section')}
            >
              <option value="">All sections</option>
              {sections.map((s) => (
                <option key={s._id} value={s._id}>
                  Section {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Start date">
            <input
              type="date"
              className="form-input"
              value={f.startDate}
              onChange={set('startDate')}
            />
          </Field>
          <Field label="End date">
            <input
              type="date"
              className="form-input"
              value={f.endDate}
              min={f.startDate}
              onChange={set('endDate')}
            />
          </Field>
          <Field label="Start time">
            <input
              type="time"
              className="form-input"
              value={f.startTime}
              onChange={set('startTime')}
            />
          </Field>
          <Field label="End time">
            <input type="time" className="form-input" value={f.endTime} onChange={set('endTime')} />
          </Field>
          <Field label="Duration (minutes)">
            <input
              type="number"
              min="1"
              className="form-input"
              value={f.duration}
              onChange={set('duration')}
            />
          </Field>
          <Field label="Total marks">
            <input
              type="number"
              min="1"
              className="form-input"
              value={f.totalMarks}
              onChange={set('totalMarks')}
            />
          </Field>
          <Field label="Passing marks">
            <input
              type="number"
              min="0"
              className="form-input"
              value={f.passingMarks}
              onChange={set('passingMarks')}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Instructions">
              <textarea
                className="form-textarea"
                value={f.instructions}
                onChange={set('instructions')}
              />
            </Field>
          </div>
        </div>
      </div>
      <div className="flex justify-between">
        <Link to="/exams" className="btn-outline">
          Cancel
        </Link>
        <button type="submit" disabled={create.isPending} className="btn-primary">
          {create.isPending ? 'Saving...' : 'Schedule exam'}
        </button>
      </div>
    </form>
  );
};

export default AddExamPage;
