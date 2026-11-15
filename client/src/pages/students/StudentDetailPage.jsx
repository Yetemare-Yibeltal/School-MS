import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const TABS = ['overview', 'attendance', 'results', 'fees', 'library', 'suspensions'];

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB') : '-');

const Item = ({ label, value }) => (
  <div>
    <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
    <p className="text-sm font-medium text-slate-800 mt-0.5">{value || '-'}</p>
  </div>
);

const Empty = ({ cols, text }) => (
  <tr>
    <td colSpan={cols} className="py-10 text-center text-slate-400">
      {text}
    </td>
  </tr>
);

const StudentDetailPage = () => {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState('overview');
  const canSeeSuspensions = ['super_admin', 'admin', 'teacher'].includes(user?.role);

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: async () => (await api.get(`/students/${id}`)).data.data.student,
  });

  const tabQuery = (key, path, enabled) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery({
      queryKey: [key, id],
      queryFn: async () => (await api.get(`/students/${id}/${path}`)).data.data,
      enabled,
    });

  const attendance = tabQuery('student-attendance', 'attendance', tab === 'attendance');
  const results = tabQuery('student-results', 'results', tab === 'results');
  const fees = tabQuery('student-fees', 'fees', tab === 'fees');
  const library = tabQuery('student-library', 'library', tab === 'library');
  const suspensions = tabQuery(
    'student-suspensions',
    'suspensions',
    tab === 'suspensions' && canSeeSuspensions
  );

  if (isLoading) {
    return <div className="card p-8 text-center text-slate-400">Loading...</div>;
  }
  if (!student) {
    return (
      <div className="card p-10 text-center">
        <p className="text-slate-500">Student not found.</p>
        <Link to="/students" className="btn-primary mt-4 inline-flex">
          Back to students
        </Link>
      </div>
    );
  }

  const stats = attendance.data?.stats || {};
  const recent = attendance.data?.recentAttendance || [];
  const feeData = fees.data || {};
  const feeKeys = Object.entries(feeData).filter(([, v]) => typeof v !== 'object' || v === null);
  const feeLists = Object.entries(feeData).filter(([, v]) => Array.isArray(v));
  const fullName = `${student.firstName} ${student.fatherName} ${student.grandFatherName || ''}`;
  const guardian = student.primaryGuardian || student.guardians?.[0];

  return (
    <div className="space-y-5">
      <div className="text-sm text-slate-500">
        <Link to="/students">Students</Link> / <b className="text-slate-900">{fullName}</b>
      </div>

      <div className="card p-6 flex items-center gap-5 justify-between flex-wrap">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-indigo-100 text-indigo-700 text-2xl font-bold flex items-center justify-center overflow-hidden">
            {student.photo?.url ? (
              <img src={student.photo.url} alt="" className="w-full h-full object-cover" />
            ) : (
              `${student.firstName?.[0] || ''}${student.fatherName?.[0] || ''}`
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{fullName}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="badge badge-primary">{student.grade}</span>
              <span className="badge badge-gray capitalize">{student.status}</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">ID: {student.studentId}</p>
          </div>
        </div>
        <Link to={`/students/${id}/edit`} className="btn-outline">
          Edit
        </Link>
      </div>

      <div className="card">
        <div className="flex gap-1 px-4 border-b overflow-x-auto">
          {TABS.filter((t) => t !== 'suspensions' || canSeeSuspensions).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium capitalize border-b-2 ${
                tab === t
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="card-body grid grid-cols-2 md:grid-cols-4 gap-4">
            <Item label="Gender" value={student.gender} />
            <Item label="Date of birth" value={fmtDate(student.dateOfBirth)} />
            <Item label="Nationality" value={student.nationality} />
            <Item label="Religion" value={student.religion} />
            <Item label="Phone" value={student.phone} />
            <Item label="Email" value={student.email} />
            <Item label="Admission date" value={fmtDate(student.admissionDate)} />
            <Item label="Admission type" value={student.admissionType} />
            <Item label="Previous school" value={student.previousSchool} />
            <Item label="Guardian" value={guardian?.name || guardian?.guardianName} />
            <Item label="Guardian phone" value={guardian?.phone} />
            <Item label="Relationship" value={guardian?.relationship} />
          </div>
        )}

        {tab === 'attendance' && (
          <div className="card-body space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(stats)
                .filter(([, v]) => typeof v !== 'object')
                .map(([k, v]) => (
                  <div key={k} className="p-3 rounded-xl border text-center">
                    <p className="text-xl font-bold text-slate-900">{String(v)}</p>
                    <p className="text-xs text-slate-500">{k}</p>
                  </div>
                ))}
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <Empty cols={3} text="No attendance records" />
                ) : (
                  recent.map((r) => (
                    <tr key={r._id}>
                      <td>{fmtDate(r.date)}</td>
                      <td className="capitalize">{r.status}</td>
                      <td>{r.remarks || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'results' && (
          <table className="table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Exam</th>
                <th>Marks</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {(results.data?.results || []).length === 0 ? (
                <Empty cols={4} text="No results yet" />
              ) : (
                results.data.results.map((r) => (
                  <tr key={r._id}>
                    <td>{r.subjectName || r.subject?.name || '-'}</td>
                    <td>{r.examTypeName || r.exam?.title || '-'}</td>
                    <td>{r.isAbsent ? 'Absent' : `${r.marksObtained}/${r.totalMarks}`}</td>
                    <td>{r.gradeLetter || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {tab === 'fees' && (
          <div className="card-body space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {feeKeys.map(([k, v]) => (
                <div key={k} className="p-3 rounded-xl border text-center">
                  <p className="text-lg font-bold text-slate-900">{String(v)}</p>
                  <p className="text-xs text-slate-500">{k}</p>
                </div>
              ))}
            </div>
            {feeLists.map(([k, list]) => (
              <div key={k}>
                <p className="text-sm font-semibold mb-2">{k}</p>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fee</th>
                      <th>Net</th>
                      <th>Paid</th>
                      <th>Remaining</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((f) => (
                      <tr key={f._id}>
                        <td>{f.feeTypeName || f.feeType?.name || '-'}</td>
                        <td>{f.netAmount ?? '-'}</td>
                        <td>{f.paidAmount ?? '-'}</td>
                        <td>{f.remainingAmount ?? '-'}</td>
                        <td className="capitalize">{f.status || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {tab === 'library' && (
          <table className="table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Issued</th>
                <th>Due</th>
                <th>Returned</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(library.data?.issues || []).length === 0 ? (
                <Empty cols={5} text="No library history" />
              ) : (
                library.data.issues.map((i) => (
                  <tr key={i._id}>
                    <td>{i.bookTitle || i.book?.title || '-'}</td>
                    <td>{fmtDate(i.issueDate)}</td>
                    <td>{fmtDate(i.dueDate)}</td>
                    <td>{fmtDate(i.returnDate)}</td>
                    <td className="capitalize">{i.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {tab === 'suspensions' && canSeeSuspensions && (
          <table className="table">
            <thead>
              <tr>
                <th>Start</th>
                <th>Type</th>
                <th>Offense</th>
                <th>Days</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(suspensions.data?.suspensions || []).length === 0 ? (
                <Empty cols={5} text="No suspensions" />
              ) : (
                suspensions.data.suspensions.map((s) => (
                  <tr key={s._id}>
                    <td>{fmtDate(s.startDate)}</td>
                    <td>{s.type}</td>
                    <td>{s.offenseCategory}</td>
                    <td>{s.numberOfDays}</td>
                    <td className="capitalize">{s.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StudentDetailPage;
