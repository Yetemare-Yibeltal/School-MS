// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// TIMETABLE PAGE
// kat-school/client/src/pages/academic/TimetablePage.jsx
// ============================================

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = Array.from({ length: 8 }, (_, i) => i + 1);

const SUBJECT_COLORS = [
  'bg-indigo-50 border-indigo-300 text-indigo-900',
  'bg-green-50 border-green-300 text-green-900',
  'bg-amber-50 border-amber-300 text-amber-900',
  'bg-purple-50 border-purple-300 text-purple-900',
  'bg-red-50 border-red-300 text-red-900',
  'bg-blue-50 border-blue-300 text-blue-900',
  'bg-teal-50 border-teal-300 text-teal-900',
  'bg-orange-50 border-orange-300 text-orange-900',
];

const TimetablePage = () => {
  const [selectedSection, setSelectedSection] = useState('');
  const [filterGrade, setFilterGrade] = useState('');

  const { data: sectionsData } = useQuery({
    queryKey: ['sections', filterGrade],
    queryFn: async () => {
      const params = filterGrade ? `?grade=${filterGrade}` : '';
      const res = await api.get(`/academic/sections${params}`);
      return res.data.data.sections;
    },
  });

  const { data: timetableData, isLoading: ttLoading } = useQuery({
    queryKey: ['timetable', selectedSection],
    queryFn: async () => {
      const res = await api.get(`/academic/timetables?section=${selectedSection}`);
      return res.data.data.timetables;
    },
    enabled: !!selectedSection,
  });

  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['timetable-slots', timetableData?.[0]?._id],
    queryFn: async () => {
      const res = await api.get(`/academic/timetables/${timetableData[0]._id}`);
      return res.data.data;
    },
    enabled: !!timetableData?.[0]?._id,
  });

  const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

  // Build timetable matrix
  const matrix = {};
  DAYS.forEach((d) => {
    matrix[d] = {};
  });

  const subjectColorMap = {};
  let colorIndex = 0;

  (slotsData?.slots || []).forEach((slot) => {
    if (!matrix[slot.dayOfWeek]) matrix[slot.dayOfWeek] = {};
    matrix[slot.dayOfWeek][slot.periodNumber] = slot;

    if (slot.subjectName && !subjectColorMap[slot.subjectName]) {
      subjectColorMap[slot.subjectName] = SUBJECT_COLORS[colorIndex % SUBJECT_COLORS.length];
      colorIndex++;
    }
  });

  const selectedSectionDoc = (sectionsData || []).find((s) => s._id === selectedSection);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Timetable</h1>
          <p className="page-subtitle">Weekly class schedules by section</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="form-label text-xs">Grade</label>
            <select
              value={filterGrade}
              onChange={(e) => {
                setFilterGrade(e.target.value);
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
          <div>
            <label className="form-label text-xs">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="form-select w-52"
            >
              <option value="">Select section to view timetable</option>
              {(sectionsData || []).map((s) => (
                <option key={s._id} value={s._id}>
                  {s.grade} — Section {s.name} ({s.currentEnrollment} students)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!selectedSection ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">⏰</div>
          <p className="text-slate-500 font-medium">Select a section to view its timetable</p>
          <p className="text-slate-400 text-sm mt-1">
            Choose a grade and section from the filters above
          </p>
        </div>
      ) : ttLoading || slotsLoading ? (
        <div className="card p-8 text-center">
          <div className="spinner-lg mx-auto" />
          <p className="text-slate-400 text-sm mt-3">Loading timetable...</p>
        </div>
      ) : !timetableData || timetableData.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-slate-500 font-medium">No timetable found for this section</p>
          <p className="text-slate-400 text-sm mt-1">Create a timetable in the admin settings</p>
        </div>
      ) : (
        <>
          {/* Section Info Header */}
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedSectionDoc?.grade} — Section {selectedSectionDoc?.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {slotsData?.timetable?.academicYearName} &bull; {slotsData?.timetable?.termName}
                </p>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <p className="font-bold text-slate-900">
                    {(slotsData?.slots || []).filter((s) => s.slotType === 'Regular').length}
                  </p>
                  <p className="text-xs text-slate-500">Periods</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-900">{Object.keys(subjectColorMap).length}</p>
                  <p className="text-xs text-slate-500">Subjects</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timetable Grid */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-200 p-3 text-left text-xs font-semibold text-slate-500 uppercase w-20">
                      Period
                    </th>
                    {DAYS.map((day) => (
                      <th
                        key={day}
                        className="border border-slate-200 p-3 text-center text-xs font-semibold text-slate-700 uppercase min-w-[140px]"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERIODS.map((period) => (
                    <tr key={period} className={period % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="border border-slate-200 p-2 text-center">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm mx-auto">
                          {period}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">P{period}</p>
                      </td>
                      {DAYS.map((day) => {
                        const slot = matrix[day]?.[period];
                        if (!slot) {
                          return (
                            <td key={day} className="border border-slate-200 p-2">
                              <div className="h-14 rounded-lg bg-slate-100/50 flex items-center justify-center">
                                <span className="text-slate-300 text-xs">Free</span>
                              </div>
                            </td>
                          );
                        }

                        if (slot.slotType === 'Break') {
                          return (
                            <td key={day} className="border border-slate-200 p-1">
                              <div className="h-14 rounded-lg bg-slate-200 flex items-center justify-center">
                                <span className="text-slate-500 text-xs font-medium">☕ Break</span>
                              </div>
                            </td>
                          );
                        }

                        const colorClass = subjectColorMap[slot.subjectName] || SUBJECT_COLORS[0];
                        return (
                          <td key={day} className="border border-slate-200 p-1">
                            <div
                              className={`h-14 rounded-lg border p-2 flex flex-col justify-between ${colorClass}`}
                            >
                              <p className="text-xs font-semibold leading-tight truncate">
                                {slot.subjectName}
                              </p>
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] opacity-70 truncate">
                                  {slot.teacherName?.split(' ').slice(0, 2).join(' ')}
                                </p>
                                {slot.roomName && (
                                  <p className="text-[10px] opacity-60">{slot.roomName}</p>
                                )}
                              </div>
                              {slot.startTime && (
                                <p className="text-[10px] opacity-50">
                                  {slot.startTime}–{slot.endTime}
                                </p>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subject Legend */}
          {Object.keys(subjectColorMap).length > 0 && (
            <div className="card p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Subject Legend
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(subjectColorMap).map(([subject, colorClass]) => (
                  <div
                    key={subject}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${colorClass}`}
                  >
                    {subject}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TimetablePage;
