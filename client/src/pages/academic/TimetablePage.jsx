import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const TimetablePage = () => {
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');

  const { data: sections = [] } = useQuery({
    queryKey: ['sections', grade],
    queryFn: async () => (await api.get(`/academic/sections?grade=${grade}`)).data.data.sections,
    enabled: !!grade,
  });

  const { data: list = [] } = useQuery({
    queryKey: ['timetables', section],
    queryFn: async () =>
      (await api.get(`/academic/timetables?section=${section}`)).data.data.timetables,
    enabled: !!section,
  });

  const first = list[0]?._id;
  const { data: detail, isLoading } = useQuery({
    queryKey: ['timetable', first],
    queryFn: async () => (await api.get(`/academic/timetables/${first}`)).data.data,
    enabled: !!first,
  });

  const slots = detail?.slots || [];
  const find = (d, p) => slots.find((s) => s.dayOfWeek === d && s.periodNumber === p);
  const name = (v, alt) => v?.name || (typeof v === 'string' ? alt : alt) || '-';

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Timetable</h1>
          <p className="page-subtitle">Weekly schedule by section</p>
        </div>
        <div className="flex gap-2">
          <select
            className="form-select w-36"
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
            className="form-select w-40"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            disabled={!grade}
          >
            <option value="">Section</option>
            {sections.map((s) => (
              <option key={s._id} value={s._id}>
                Section {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!section && (
        <div className="card p-12 text-center text-slate-500">Select a grade and section.</div>
      )}
      {section && list.length === 0 && (
        <div className="card p-12 text-center text-slate-500">
          No timetable created for this section yet.
        </div>
      )}
      {isLoading && <div className="card p-8 text-center text-slate-400">Loading...</div>}

      {first && detail && (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-3 text-left text-xs uppercase text-slate-500">Period</th>
                {DAYS.map((d) => (
                  <th key={d} className="p-3 text-left text-xs uppercase text-slate-500">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((p) => (
                <tr key={p} className="border-t">
                  <td className="p-3 font-medium">P{p}</td>
                  {DAYS.map((d) => {
                    const s = find(d, p);
                    return (
                      <td key={d} className="p-2">
                        {s ? (
                          <div className="bg-indigo-50 border border-indigo-200 rounded p-2">
                            <p className="font-semibold text-xs text-indigo-900">
                              {name(s.subject, s.subjectName)}
                            </p>
                            <p className="text-xs text-slate-500">
                              {s.startTime}-{s.endTime}
                            </p>
                          </div>
                        ) : (
                          <div className="h-10 rounded bg-slate-50" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TimetablePage;
