// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// HRM DASHBOARD PAGE
// kat-school/client/src/pages/hrm/HRMDashboardPage.jsx
// ============================================

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const HRMDashboardPage = () => {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['hrm-dashboard'],
    queryFn: async () => {
      const res = await api.get('/hrm/dashboard');
      return res.data.data;
    },
  });

  const stats = dashboard?.staffStats || {};
  const pendingLeaves = dashboard?.pendingLeaves || [];
  const payrollStats = dashboard?.payrollStats || {};
  const byDepartment = dashboard?.byDepartment || [];
  const upcomingBirthdays = dashboard?.upcomingBirthdays || [];
  const contractsExpiring = dashboard?.contractsExpiring || [];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">HR Dashboard</h1>
          <p className="page-subtitle">Human resources overview and management</p>
        </div>
        <div className="flex gap-2">
          <Link to="/hrm/payroll" className="btn-outline btn-sm">
            💼 Run Payroll
          </Link>
        </div>
      </div>

      {/* Key Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-5">
              <div className="h-16 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Staff',
              value: (stats.totalTeachers || 0) + (stats.totalEmployees || 0),
              icon: '👥',
              color: '#4f46e5',
              to: '/teachers',
            },
            {
              label: 'Teachers',
              value: stats.totalTeachers || 0,
              icon: '👨‍🏫',
              color: '#7c3aed',
              to: '/teachers',
            },
            {
              label: 'Employees',
              value: stats.totalEmployees || 0,
              icon: '👔',
              color: '#0891b2',
              to: '/employees',
            },
            {
              label: 'On Leave Today',
              value: stats.onLeave || 0,
              icon: '🏖️',
              color: '#f59e0b',
              to: '/hrm/leaves',
            },
            {
              label: 'Pending Leaves',
              value: pendingLeaves.length,
              icon: '⏳',
              color: '#ef4444',
              to: '/hrm/leaves',
            },
            {
              label: 'This Month Payroll',
              value: `ETB ${Number(payrollStats.thisMonth || 0).toLocaleString()}`,
              icon: '💰',
              color: '#10b981',
              to: '/hrm/payroll',
            },
            {
              label: 'Contracts Expiring',
              value: contractsExpiring.length,
              icon: '📋',
              color: '#f97316',
              to: '/employees',
            },
            {
              label: 'Departments',
              value: byDepartment.length,
              icon: '🏢',
              color: '#8b5cf6',
              to: '/hrm/departments',
            },
          ].map((stat) => (
            <Link
              key={stat.label}
              to={stat.to}
              className="card p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Leave Applications */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Pending Leave Applications</h3>
            <Link to="/hrm/leaves" className="text-xs text-indigo-600">
              View All →
            </Link>
          </div>
          {pendingLeaves.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm">No pending leave applications</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingLeaves.slice(0, 5).map((leave) => (
                <div key={leave._id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 flex-shrink-0 flex items-center justify-center text-amber-700 font-semibold text-sm">
                    {leave.staffName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{leave.staffName}</p>
                    <p className="text-xs text-slate-400">
                      {leave.leaveTypeName} &bull; {leave.numberOfDays} day
                      {leave.numberOfDays !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(leave.startDate).toLocaleDateString('en-ET')} –{' '}
                      {new Date(leave.endDate).toLocaleDateString('en-ET')}
                    </p>
                  </div>
                  <Link to="/hrm/leaves" className="btn-primary btn-sm flex-shrink-0">
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Staff by Department */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Staff by Department</h3>
            <Link to="/hrm/departments" className="text-xs text-indigo-600">
              Manage →
            </Link>
          </div>
          <div className="card-body space-y-3">
            {byDepartment.length === 0 ? (
              <div className="text-center text-slate-400 py-6">
                <p className="text-sm">No department data</p>
              </div>
            ) : (
              byDepartment.map((dept) => (
                <div key={dept._id} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-32 truncate">{dept.name}</span>
                  <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (dept.count / Math.max(...byDepartment.map((d) => d.count))) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-6 text-right">
                    {dept.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Birthdays */}
        {upcomingBirthdays.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold">🎂 Upcoming Birthdays</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {upcomingBirthdays.slice(0, 5).map((staff) => (
                <div key={staff._id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-9 h-9 rounded-full bg-pink-100 flex-shrink-0 flex items-center justify-center text-pink-700 font-semibold text-sm">
                    {staff.firstName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {staff.firstName} {staff.fatherName}
                    </p>
                    <p className="text-xs text-slate-400">{staff.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-pink-600">
                      {new Date(staff.dateOfBirth).toLocaleDateString('en-ET', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expiring Contracts */}
        {contractsExpiring.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-amber-700">⚠️ Contracts Expiring Soon</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {contractsExpiring.map((emp) => {
                const daysLeft = Math.ceil(
                  (new Date(emp.contractEndDate) - new Date()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div key={emp._id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {emp.firstName} {emp.fatherName}
                      </p>
                      <p className="text-xs text-slate-400">{emp.designationName}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`badge text-xs ${
                          daysLeft <= 7 ? 'badge-danger' : 'badge-warning'
                        }`}
                      >
                        {daysLeft}d left
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(emp.contractEndDate).toLocaleDateString('en-ET')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HRMDashboardPage;
