// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// EMPLOYEE DETAIL PAGE
// kat-school/client/src/pages/employees/EmployeeDetailPage.jsx
// ============================================

import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '👤' },
  { id: 'attendance', label: 'Attendance', icon: '✅' },
  { id: 'leave', label: 'Leave', icon: '🏖️' },
  { id: 'payroll', label: 'Payroll', icon: '💰' },
];

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
    <p className="text-sm text-slate-800 font-medium mt-0.5">{value || '—'}</p>
  </div>
);

const EmployeeDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [photoUploading, setPhotoUploading] = useState(false);

  const canManage = ['super_admin', 'admin', 'hr_manager'].includes(user?.role);

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const res = await api.get(`/employees/${id}`);
      return res.data.data.employee;
    },
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['employee-attendance', id],
    queryFn: async () => {
      const now = new Date();
      const res = await api.get(
        `/employees/${id}/attendance?month=${now.getMonth() + 1}&year=${now.getFullYear()}`
      );
      return res.data.data;
    },
    enabled: activeTab === 'attendance' && canManage,
  });

  const { data: leaveData } = useQuery({
    queryKey: ['employee-leaves', id],
    queryFn: async () => {
      const [balances, applications] = await Promise.all([
        api.get(`/employees/${id}/leave-balances`),
        api.get(`/employees/${id}/leave-applications?limit=10`),
      ]);
      return {
        balances: balances.data.data.balances,
        applications: applications.data.data.applications,
      };
    },
    enabled: activeTab === 'leave',
  });

  const { data: payrollData } = useQuery({
    queryKey: ['employee-payroll', id],
    queryFn: async () => {
      const res = await api.get(`/employees/${id}/payroll?limit=12`);
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
      await api.post(`/employees/${id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Photo updated.');
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
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

  if (!employee) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Employee not found.</p>
        <Link to="/employees" className="btn-primary mt-4 inline-flex">
          Back to Employees
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/employees" className="hover:text-slate-700">
          Employees
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">
          {employee.firstName} {employee.fatherName}
        </span>
      </div>

      {/* Profile Card */}
      <div className="card">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="relative group flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-teal-100 overflow-hidden flex items-center justify-center text-teal-700 text-3xl font-bold border-2 border-slate-200">
                {employee.photo?.url ? (
                  <img
                    src={employee.photo.url}
                    alt={employee.firstName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {employee.firstName?.[0]}
                    {employee.fatherName?.[0]}
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
                    {employee.firstName} {employee.fatherName} {employee.grandFatherName || ''}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="badge badge-primary">{employee.departmentName}</span>
                    <span className="badge badge-gray">{employee.designationName}</span>
                    <span
                      className={`badge capitalize ${
                        employee.status === 'active'
                          ? 'badge-success'
                          : employee.status === 'on_leave'
                          ? 'badge-warning'
                          : 'badge-gray'
                      }`}
                    >
                      {employee.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    ID: <strong className="text-slate-700">{employee.employeeId}</strong>
                    &bull; {employee.employmentType}
                  </p>
                </div>
                {canManage && (
                  <Link to={`/employees/${id}/edit`} className="btn-outline btn-sm flex-shrink-0">
                    Edit
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">
                    {employee.yearsOfExperience || 0}
                  </p>
                  <p className="text-xs text-slate-500">Years Exp.</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">
                    {employee.salary?.basicSalary
                      ? `ETB ${Number(employee.salary.basicSalary).toLocaleString()}`
                      : '—'}
                  </p>
                  <p className="text-xs text-slate-500">Basic Salary</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">
                    {employee.joinDate
                      ? new Date(employee.joinDate).toLocaleDateString('en-ET', {
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
              <InfoItem label="First Name" value={employee.firstName} />
              <InfoItem label="Father's Name" value={employee.fatherName} />
              <InfoItem label="Gender" value={employee.gender} />
              <InfoItem
                label="Date of Birth"
                value={
                  employee.dateOfBirth
                    ? new Date(employee.dateOfBirth).toLocaleDateString('en-ET')
                    : null
                }
              />
              <InfoItem label="Marital Status" value={employee.maritalStatus} />
              <InfoItem label="Dependents" value={employee.numberOfDependents?.toString()} />
              <InfoItem label="Phone" value={employee.phone} />
              <InfoItem label="Email" value={employee.email} />
              <InfoItem label="Nationality" value={employee.nationality} />
              <InfoItem label="Religion" value={employee.religion} />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold">Employment Details</h3>
            </div>
            <div className="card-body grid grid-cols-2 gap-4">
              <InfoItem label="Department" value={employee.departmentName} />
              <InfoItem label="Designation" value={employee.designationName} />
              <InfoItem label="Qualification" value={employee.qualification} />
              <InfoItem label="Field of Study" value={employee.fieldOfStudy} />
              <InfoItem label="Experience" value={`${employee.yearsOfExperience || 0} years`} />
              <InfoItem label="Employment Type" value={employee.employmentType} />
              <InfoItem
                label="Join Date"
                value={
                  employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('en-ET') : null
                }
              />
              <InfoItem
                label="Contract End"
                value={
                  employee.contractEndDate
                    ? new Date(employee.contractEndDate).toLocaleDateString('en-ET')
                    : null
                }
              />
            </div>
          </div>
          {employee.emergencyContact && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-sm font-semibold">Emergency Contact</h3>
              </div>
              <div className="card-body grid grid-cols-2 gap-4">
                <InfoItem
                  label="Name"
                  value={employee.emergencyContact.name}
                  className="col-span-2"
                />
                <InfoItem label="Relationship" value={employee.emergencyContact.relationship} />
                <InfoItem label="Phone" value={employee.emergencyContact.phone} />
              </div>
            </div>
          )}
          {canManage && employee.salary && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-sm font-semibold">Compensation</h3>
              </div>
              <div className="card-body grid grid-cols-2 gap-4">
                <InfoItem
                  label="Basic Salary"
                  value={`ETB ${Number(employee.salary.basicSalary || 0).toLocaleString()}`}
                />
                <InfoItem
                  label="Housing Allowance"
                  value={`ETB ${Number(employee.salary.housingAllowance || 0).toLocaleString()}`}
                />
                <InfoItem
                  label="Transport Allowance"
                  value={`ETB ${Number(employee.salary.transportAllowance || 0).toLocaleString()}`}
                />
                <InfoItem
                  label="Medical Allowance"
                  value={`ETB ${Number(employee.salary.medicalAllowance || 0).toLocaleString()}`}
                />
                <InfoItem label="Bank Name" value={employee.salary.bankName} />
                <InfoItem
                  label="Account"
                  value={
                    employee.salary.bankAccountNumber
                      ? `****${employee.salary.bankAccountNumber.slice(-4)}`
                      : null
                  }
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attendance */}
      {activeTab === 'attendance' && canManage && (
        <div className="space-y-4">
          {attendanceData?.stats && (
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: 'Total', value: attendanceData.stats.totalDays },
                { label: 'Present', value: attendanceData.stats.present },
                { label: 'Absent', value: attendanceData.stats.absent },
                { label: 'Late', value: attendanceData.stats.late },
                { label: 'On Leave', value: attendanceData.stats.onLeave },
              ].map((s) => (
                <div key={s.label} className="card p-3 text-center">
                  <p className="text-xl font-bold">{s.value || 0}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          )}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold">This Month</h3>
            </div>
            <div className="table-container rounded-none border-0">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Check In</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(attendanceData?.attendance || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No attendance records
                      </td>
                    </tr>
                  ) : (
                    (attendanceData?.attendance || []).map((rec) => (
                      <tr key={rec._id}>
                        <td className="text-sm">
                          {new Date(rec.date).toLocaleDateString('en-ET', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </td>
                        <td>
                          <span
                            className={`badge text-xs capitalize ${
                              rec.status === 'present'
                                ? 'badge-success'
                                : rec.status === 'absent'
                                ? 'badge-danger'
                                : rec.status === 'late'
                                ? 'badge-warning'
                                : 'badge-gray'
                            }`}
                          >
                            {rec.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="text-xs text-slate-500">{rec.checkInTime || '—'}</td>
                        <td className="text-xs text-slate-500">{rec.remarks || '—'}</td>
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
          {(leaveData?.balances || []).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(leaveData?.balances || []).map((balance) => (
                <div key={balance._id} className="card p-4">
                  <p className="text-xs text-slate-500 mb-1">{balance.leaveTypeName}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl font-bold">{balance.availableDays}</span>
                    <span className="text-slate-400 text-sm mb-0.5">/ {balance.totalDays}</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full"
                      style={{
                        width: `${
                          balance.totalDays > 0
                            ? (balance.availableDays / balance.totalDays) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold">Leave Applications</h3>
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
                                : 'badge-warning'
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
          </div>
          <div className="table-container rounded-none border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Basic Salary</th>
                  <th>Gross</th>
                  <th>Tax</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(payrollData || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
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
                      <td className="text-sm font-bold text-green-700">
                        ETB {Number(p.netSalary).toLocaleString()}
                      </td>
                      <td>
                        <span
                          className={`badge text-xs ${p.isPaid ? 'badge-success' : 'badge-gray'}`}
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

export default EmployeeDetailPage;
