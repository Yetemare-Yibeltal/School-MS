import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/common/Modal';

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const nameOf = (c) =>
  c.studentName ||
  (c.student && typeof c.student === 'object'
    ? `${c.student.firstName || ''} ${c.student.fatherName || ''}`.trim()
    : '-');
const num = (v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : '-');

const ReportCardsPage = () => {
  const qc = useQueryClient();
  const [yearSel, setYearSel] = useState('');
  const [term, setTerm] = useState('');
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [html, setHtml] = useState(null);

  const { data: years = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => (await api.get('/academic/years')).data.data.academicYears,
  });
  const year = yearSel || years.find((y) => y.isCurrent)?._id || '';
  const { data: terms = [] } = useQuery({
    queryKey: ['terms', year],
    queryFn: async () => (await api.get(`/academic/terms?academicYear=${year}`)).data.data.terms,
    enabled: !!year,
  });
  const { data: sections = [] } = useQuery({
    queryKey: ['sections', grade],
    queryFn: async () => (await api.get(`/academic/sections?grade=${grade}`)).data.data.sections,
    enabled: !!grade,
  });
  const { data: dash } = useQuery({
    queryKey: ['rc-dashboard', year, term],
    queryFn: async () =>
      (await api.get(`/report-cards/dashboard?academicYear=${year}&term=${term}`)).data.data,
    enabled: !!year && !!term,
  });
  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['rc-section', section, year, term],
    queryFn: async () =>
      (await api.get(`/report-cards/section/${section}?academicYear=${year}&term=${term}`)).data
        .data.reportCards || [],
    enabled: !!section && !!year && !!term,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['rc-section'] });
    qc.invalidateQueries({ queryKey: ['rc-dashboard'] });
  };
  const fail = (err) => toast.error(err.response?.data?.message || 'Request failed.');
  const body = { grade, section: section || undefined, academicYearId: year, termId: term };

  const generate = useMutation({
    mutationFn: () => api.post('/report-cards/bulk-generate', body),
    onSuccess: (r) => {
      toast.success(r.data.message);
      refresh();
    },
    onError: fail,
  });
  const publish = useMutation({
    mutationFn: () => api.post('/report-cards/bulk-publish', body),
    onSuccess: (r) => {
      toast.success(r.data.message);
      refresh();
    },
    onError: fail,
  });

  const view = async (id) => {
    try {
      const r = await api.get(`/report-cards/${id}`);
      setHtml(r.data.data.html);
    } catch (err) {
      fail(err);
    }
  };

  const ready = grade && year && term;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Report Cards</h1>
          <p className="page-subtitle">Generate, review and publish</p>
        </div>
      </div>

      {dash && (
        <div className="grid grid-cols-3 gap-3">
          {[
            ['Total', dash.total],
            ['Draft', dash.draft],
            ['Published', dash.published],
          ].map(([l, v]) => (
            <div key={l} className="card p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{v ?? 0}</p>
              <p className="text-xs text-slate-500">{l}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <select
          className="form-select"
          value={year}
          onChange={(e) => {
            setYearSel(e.target.value);
            setTerm('');
          }}
        >
          {years.map((y) => (
            <option key={y._id} value={y._id}>
              {y.name}
            </option>
          ))}
        </select>
        <select className="form-select" value={term} onChange={(e) => setTerm(e.target.value)}>
          <option value="">Term</option>
          {terms.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>
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
          <option value="">All sections</option>
          {sections.map((s) => (
            <option key={s._id} value={s._id}>
              Section {s.name}
            </option>
          ))}
        </select>
        <div className="col-span-2 md:col-span-4 flex gap-2">
          <button
            type="button"
            className="btn-primary"
            disabled={!ready || generate.isPending}
            onClick={() => generate.mutate()}
          >
            {generate.isPending ? 'Generating...' : 'Generate'}
          </button>
          <button
            type="button"
            className="btn-success"
            disabled={!ready || publish.isPending}
            onClick={() => window.confirm('Publish these report cards?') && publish.mutate()}
          >
            Publish
          </button>
        </div>
      </div>

      {section && term && (
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th>Average</th>
                <th>GPA</th>
                <th>Status</th>
                <th className="text-right">View</th>
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
              {!isLoading && cards.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No report cards yet. Click Generate.
                  </td>
                </tr>
              )}
              {cards.map((c, i) => (
                <tr key={c._id}>
                  <td>{c.rank || i + 1}</td>
                  <td>{nameOf(c)}</td>
                  <td>{num(c.averageScore ?? c.totalScore)}</td>
                  <td>{num(c.gpa)}</td>
                  <td className="capitalize">{c.status}</td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      onClick={() => view(c._id)}
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!html} title="Report card" onClose={() => setHtml(null)}>
        <iframe
          title="Report card"
          srcDoc={html || ''}
          className="w-full h-[60vh] border rounded"
          sandbox=""
        />
      </Modal>
    </div>
  );
};

export default ReportCardsPage;
