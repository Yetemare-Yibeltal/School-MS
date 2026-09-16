// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// TEACHER DETAIL PAGE
// kat-school/client/src/pages/teachers/TeacherDetailPage.jsx
// ============================================

import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '👤' },
  { id: 'timetable', label: 'Timetable', icon: '⏰' },
  { id: 'attendance', label: 'Attendance', icon: '✅' },
  { id: 'leave', label: 'Leave', icon: '🏖️' },
  { id: 'payroll', label: 'Payroll', icon: '💰' },
];

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
    <p className="text-sm text-slate-800 font-medium mt-0.5">{value || '—'}</p>
  </div>
);

const TeacherDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [photoUploading, setPhotoUploading] = useState(false);

  const canManage = ['super_admin', 'admin', 'hr_manager'].includes(user?.role);

  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teacher', id],
    queryFn: async () => {
      const res = await api.get(`/teachers/${id}`);
      return res.data.data.teacher;
    },
  });

  const { data: timetableData } = useQuery({
    queryKey: ['teacher-timetable', id],
    queryFn: async () => {
      const res = await api.get(`/teachers/${id}/timetable`);
      return res.data.data;
    },
    enabled: activeTab === 'timetable',
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['teacher-attendance', id],
    queryFn: async () => {
      const now = new Date();
      const res = await api.get(
        `/teachers/${id}/attendance?month=${now.getMonth() + 1}&year=${now.getFullYear()}`
      );
      return res.data.data;
    },
    enabled: activeTab === 'attendance' && canManage,
  });

  const { data: leaveData } = useQuery({
    queryKey: ['teacher-leaves', id],
    queryFn: async () => {
      const [balances, applications] = await Promise.all([
        api.get(`/teachers/${id}/leave-balances`),
        api.get(`/teachers/${id}/leave-applications?limit=10`),
      ]);
      return {
        balances: balances.data.data.balances,
        applications: applications.data.data.applications,
      };
    },
    enabled: activeTab === 'leave',
  });

  const { data: payrollData } = useQuery({
    queryKey: ['teacher-payroll', id],
    queryFn: async () => {
      const res = await api.get(`/teachers/${id}/payroll?limit=12`);
      return res.data.data.payrolls;
    },
    enabled: activeTab === 'payroll' && canManage,
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    const formData = new FormData();
    formData.append('photo', file);
    try {
      await api.post(`/teachers/${id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Photo updated.');
      queryClient.invalidateQueries({ queryKey: ['teacher', id] });
    } catch {
      toast.error('Photo upload failed.');
    } finally {
      setPhotoUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 bg-slate-100 rounded w-48" />
        <div className="card p-6">
          <div className="h-32 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Teacher not found.</p>
        <Link to="/teachers" className="btn-primary mt-4 inline-flex">
          Back to Teachers
        </Link>
      </div>
    );
  }

  // Organize timetable by day
  const timetableByDay = {};
  DAY_ORDER.forEach((day) => {
    timetableByDay[day] = [];
  });
  (timetableData?.slots || []).forEach((slot) => {
    if (timetableByDay[slot.dayOfWeek]) {
      timetableByDay[slot.dayOfWeek].push(slot);
    }
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/teachers" className="hover:text-slate-700">
          Teachers
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">
          {teacher.firstName} {teacher.fatherName}
        </span>
      </div>

      {/* Profile Card */}
      <div className="card">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="relative group flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-purple-100 overflow-hidden flex items-center justify-center text-purple-700 text-3xl font-bold border-2 border-slate-200">
                {teacher.photo?.url ? (
                  <img
                    src={teacher.photo.url}
                    alt={teacher.firstName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {teacher.firstName?.[0]}
                    {teacher.fatherName?.[0]}
                  </span>
                )}
              </div>
              {canManage && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                  </svg>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
              {photoUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
                  <div className="spinner-md border-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {teacher.firstName} {teacher.fatherName} {teacher.grandFatherName || ''}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="badge badge-primary">{teacher.primarySubject}</span>
                    <span
                      className={`badge capitalize ${
                        teacher.status === 'active'
                          ? 'badge-success'
                          : teacher.status === 'on_leave'
                          ? 'badge-warning'
                          : 'badge-gray'
                      }`}
                    >
                      {teacher.status?.replace('_', ' ')}
                    </span>
                    <span className="badge badge-gray">{teacher.employmentType}</span>
                    {teacher.isHomeRoomTeacher && (
                      <span className="badge badge-info">🏠 Homeroom Teacher</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    ID: <strong className="text-slate-700">{teacher.teacherId}</strong>
                    {teacher.qualification && (
                      <>
                        {' '}
                        &bull; {teacher.qualification} in {teacher.fieldOfStudy}
                      </>
                    )}
                  </p>
                </div>
                {canManage && (
                  <Link to={`/teachers/${id}/edit`} className="btn-outline btn-sm flex-shrink-0">
                    Edit
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">
                    {teacher.yearsOfExperience || 0}
                  </p>
                  <p className="text-xs text-slate-500">Years Experience</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">
                    {(teacher.gradesCanTeach || []).length}
                  </p>
                  <p className="text-xs text-slate-500">Grades Teaching</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">
                    {teacher.joinDate
                      ? new Date(teacher.joinDate).toLocaleDateString('en-ET', {
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </p>
                  <p className="text-xs text-slate-500">Joined</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 overflow-x-auto no-scrollbar">
          <nav className="flex px-4">
            {TABS.map((tab) => {
              if ((tab.id === 'attendance' || tab.id === 'payroll') && !canManage) return null;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold">Personal Information</h3>
            </div>
            <div className="card-body grid grid-cols-2 gap-4">
              <InfoItem label="First Name" value={teacher.firstName} />
              <InfoItem label="Father's Name" value={teacher.fatherName} />
              <InfoItem label="Gender" value={teacher.gender} />
              <InfoItem
                label="Date of Birth"
                value={
                  teacher.dateOfBirth
                    ? new Date(teacher.dateOfBirth).toLocaleDateString('en-ET')
                    : null
                }
              />
              <InfoItem label="Phone" value={teacher.phone} />
              <InfoItem label="Alt. Phone" value={teacher.alternatePhone} />
              <InfoItem label="Email" value={teacher.email} />
              <InfoItem label="Nationality" value={teacher.nationality} />
              <InfoItem label="Religion" value={teacher.religion} />
              <InfoItem label="Blood Group" value={teacher.bloodGroup} />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold">Professional Information</h3>
            </div>
            <div className="card-body grid grid-cols-2 gap-4">
              <InfoItem label="Primary Subject" value={teacher.primarySubject} />
              <InfoItem
                label="Secondary Subjects"
                value={(teacher.secondarySubjects || []).join(', ')}
              />
              <InfoItem
                label="Grades Can Teach"
                value={(teacher.gradesCanTeach || []).join(', ')}
              />
              <InfoItem label="Qualification" value={teacher.qualification} />
              <InfoItem label="Field of Study" value={teacher.fieldOfStudy} />
              <InfoItem label="University" value={teacher.university} />
              <InfoItem
                label="Years of Experience"
                value={`${teacher.yearsOfExperience || 0} years`}
              />
              <InfoItem label="License Number" value={teacher.teachingLicenseNumber} />
              <InfoItem
                label="Join Date"
                value={
                  teacher.joinDate ? new Date(teacher.joinDate).toLocaleDateString('en-ET') : null
                }
              />
              <InfoItem label="Employment Type" value={teacher.employmentType} />
            </div>
          </div>
          {canManage && teacher.salary && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-sm font-semibold">Salary Information</h3>
              </div>
              <div className="card-body grid grid-cols-2 gap-4">
                <InfoItem
                  label="Basic Salary"
                  value={
                    teacher.salary.basicSalary
                      ? `ETB ${Number(teacher.salary.basicSalary).toLocaleString()}`
                      : null
                  }
                />
                <InfoItem label="Bank Name" value={teacher.salary.bankName} />
                <InfoItem
                  label="Account Number"
                  value={
                    teacher.salary.bankAccountNumber
                      ? `****${teacher.salary.bankAccountNumber.slice(-4)}`
                      : null
                  }
                />
                <InfoItem label="Bank Branch" value={teacher.salary.bankBranch} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timetable */}
      {activeTab === 'timetable' && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Weekly Timetable</h3>
          </div>
          <div className="card-body overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left py-2 px-3 text-xs text-slate-500 font-semibold uppercase w-24">
                    Period
                  </th>
                  {DAY_ORDER.map((day) => (
                    <th
                      key={day}
                      className="text-left py-2 px-3 text-xs text-slate-500 font-semibold uppercase"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }, (_, i) => i + 1).map((period) => (
                  <tr key={period} className="border-t border-slate-100">
                    <td className="py-2 px-3 text-xs text-slate-500 font-medium">P{period}</td>
                    {DAY_ORDER.map((day) => {
                      const slot = (timetableByDay[day] || []).find(
                        (s) => s.periodNumber === period
                      );
                      return (
                        <td key={day} className="py-2 px-3">
                          {slot ? (
                            <div className="bg-indigo-50 border border-indigo-200 rounded p-2">
                              <p className="text-xs font-semibold text-indigo-900">
                                {slot.subjectName}
                              </p>
                              <p className="text-xs text-indigo-600">
                                {slot.timetable?.section?.name &&
                                  `Section ${slot.timetable.section.name}`}
                              </p>
                              <p className="text-xs text-slate-500">
                                {slot.startTime}–{slot.endTime}
                              </p>
                              {slot.roomName && (
                                <p className="text-xs text-slate-400">{slot.roomName}</p>
                              )}
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
            {Object.values(timetableByDay).every((slots) => slots.length === 0) && (
              <div className="text-center py-8 text-slate-400">
                <p>No timetable assigned yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attendance */}
      {activeTab === 'attendance' && canManage && (
        <div className="space-y-4">
          {attendanceData?.stats && (
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: 'Total Days', value: attendanceData.stats.totalDays },
                { label: 'Present', value: attendanceData.stats.present },
                { label: 'Absent', value: attendanceData.stats.absent },
                { label: 'Late', value: attendanceData.stats.late },
                { label: 'On Leave', value: attendanceData.stats.onLeave },
              ].map((s) => (
                <div key={s.label} className="card p-3 text-center">
                  <p className="text-xl font-bold text-slate-900">{s.value || 0}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          )}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold">This Month's Attendance</h3>
            </div>
            <div className="table-container rounded-none border-0">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Check In</th>
                    <th>Late Min</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(attendanceData?.attendance || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No attendance records this month
                      </td>
                    </tr>
                  ) : (
                    (attendanceData?.attendance || []).map((record) => (
                      <tr key={record._id}>
                        <td className="text-sm">
                          {new Date(record.date).toLocaleDateString('en-ET', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </td>
                        <td>
                          <span
                            className={`badge text-xs capitalize ${
                              record.status === 'present'
                                ? 'badge-success'
                                : record.status === 'absent'
                                ? 'badge-danger'
                                : record.status === 'late'
                                ? 'badge-warning'
                                : 'badge-gray'
                            }`}
                          >
                            {record.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="text-xs text-slate-500">{record.checkInTime || '—'}</td>
                        <td className="text-xs text-slate-500">{record.lateMinutes || 0}</td>
                        <td className="text-xs text-slate-500">{record.remarks || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Leave */}
      {activeTab === 'leave' && (
        <div className="space-y-4">
          {/* Leave Balances */}
          {(leaveData?.balances || []).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(leaveData?.balances || []).map((balance) => (
                <div key={balance._id} className="card p-4">
                  <p className="text-xs text-slate-500 mb-1">{balance.leaveTypeName}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl font-bold text-slate-900">
                      {balance.availableDays}
                    </span>
                    <span className="text-slate-400 text-sm mb-0.5">
                      / {balance.totalDays} days
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{
                        width: `${
                          balance.totalDays > 0
                            ? (balance.availableDays / balance.totalDays) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{balance.usedDays} used</p>
                </div>
              ))}
            </div>
          )}

          {/* Leave Applications */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold">Leave Applications</h3>
              <Link to="/hrm/leaves" className="text-xs text-indigo-600">
                Apply Leave →
              </Link>
            </div>
            <div className="table-container rounded-none border-0">
              <table className="table">
                <thead>
                  <tr>
                    <th>App. #</th>
                    <th>Leave Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Days</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(leaveData?.applications || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No leave applications
                      </td>
                    </tr>
                  ) : (
                    (leaveData?.applications || []).map((app) => (
                      <tr key={app._id}>
                        <td className="text-xs text-slate-500">{app.applicationNumber}</td>
                        <td>
                          <span className="badge badge-primary text-xs">{app.leaveTypeName}</span>
                        </td>
                        <td className="text-xs">
                          {new Date(app.startDate).toLocaleDateString('en-ET')}
                        </td>
                        <td className="text-xs">
                          {new Date(app.endDate).toLocaleDateString('en-ET')}
                        </td>
                        <td className="text-sm font-medium">{app.numberOfDays}</td>
                        <td>
                          <span
                            className={`badge text-xs capitalize ${
                              app.status === 'approved'
                                ? 'badge-success'
                                : app.status === 'rejected'
                                ? 'badge-danger'
                                : app.status === 'pending'
                                ? 'badge-warning'
                                : 'badge-gray'
                            }`}
                          >
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payroll */}
      {activeTab === 'payroll' && canManage && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Payroll History</h3>
            <Link to="/hrm/payroll" className="text-xs text-indigo-600">
              View All →
            </Link>
          </div>
          <div className="table-container rounded-none border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Basic Salary</th>
                  <th>Gross</th>
                  <th>Tax</th>
                  <th>Pension</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(payrollData || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No payroll records
                    </td>
                  </tr>
                ) : (
                  (payrollData || []).map((p) => (
                    <tr key={p._id}>
                      <td className="text-sm font-medium">{p.periodLabel}</td>
                      <td className="text-sm">ETB {Number(p.basicSalary).toLocaleString()}</td>
                      <td className="text-sm">ETB {Number(p.grossEarnings).toLocaleString()}</td>
                      <td className="text-sm text-red-600">
                        ETB {Number(p.incomeTax).toLocaleString()}
                      </td>
                      <td className="text-sm text-amber-600">
                        ETB {Number(p.employeePension).toLocaleString()}
                      </td>
                      <td className="text-sm font-bold text-green-700">
                        ETB {Number(p.netSalary).toLocaleString()}
                      </td>
                      <td>
                        <span
                          className={`badge text-xs ${
                            p.isPaid
                              ? 'badge-success'
                              : p.status === 'approved'
                              ? 'badge-info'
                              : 'badge-gray'
                          }`}
                        >
                          {p.isPaid ? 'Paid' : p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDetailPage;
