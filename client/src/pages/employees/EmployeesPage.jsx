// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// EMPLOYEES PAGE
// kat-school/client/src/pages/employees/EmployeesPage.jsx
// ============================================

import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const EmployeesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [deleteModal, setDeleteModal] = useState({ open: false, employee: null });

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const department = searchParams.get('department') || '';
  const status = searchParams.get('status') || 'active';

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    value ? next.set(key, value) : next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const { data: deptData } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const res = await api.get('/hrm/departments');
      return res.data.data.departments;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['employees', { page, search, department, status }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(search && { search }),
        ...(department && { department }),
        ...(status && { status }),
      });
      const res = await api.get(`/employees?${params}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  const { data: statsData } = useQuery({
    queryKey: ['employees-stats'],
    queryFn: async () => {
      const res = await api.get('/employees/stats');
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/employees/${id}`),
    onSuccess: () => {
      toast.success('Employee deactivated.');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees-stats'] });
      setDeleteModal({ open: false, employee: null });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const employees = data?.data?.employees || [];
  const pagination = data?.pagination || {};
  const canManage = ['super_admin', 'admin', 'hr_manager'].includes(user?.role);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">
            {pagination.total
              ? `${pagination.total} employee${pagination.total !== 1 ? 's' : ''}`
              : 'Manage non-teaching staff'}
          </p>
        </div>
        {canManage && (
          <Link to="/employees/new" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Employee
          </Link>
        )}
      </div>

      {/* Stats */}
      {statsData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: 'Total',
              value: statsData.total,
              color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
            },
            {
              label: 'Active',
              value: statsData.active,
              color: 'bg-green-50 border-green-200 text-green-700',
            },
            ...(statsData.byDepartment || []).slice(0, 2).map((d) => ({
              label: d._id,
              value: d.count,
              color: 'bg-slate-50 border-slate-200 text-slate-700',
            })),
          ].map((stat) => (
            <div key={stat.label} className={`p-3 rounded-xl border ${stat.color}`}>
              <p className="text-xl font-bold">{stat.value || 0}</p>
              <p className="text-xs font-medium mt-0.5 truncate">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => updateParam('search', e.target.value)}
              placeholder="Search by name, ID, department..."
              className="form-input pl-9"
            />
          </div>
          <select
            value={department}
            onChange={(e) => updateParam('department', e.target.value)}
            className="form-select w-44"
          >
            <option value="">All Departments</option>
            {(deptData || []).map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => updateParam('status', e.target.value)}
            className="form-select w-32"
          >
            <option value="">All Status</option>
            {['active', 'inactive', 'on_leave', 'terminated', 'resigned'].map((s) => (
              <option key={s} value={s} className="capitalize">
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
          {(search || department || status !== 'active') && (
            <button
              onClick={() => setSearchParams({ page: '1', status: 'active' })}
              className="btn-ghost text-sm"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="table-container rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Employment</th>
                <th>Join Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j}>
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="text-4xl mb-3">👔</div>
                    <p className="text-slate-500">No employees found</p>
                    {canManage && (
                      <Link to="/employees/new" className="btn-primary mt-4 inline-flex">
                        Add First Employee
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-teal-700 font-semibold text-sm">
                          {emp.photo?.url ? (
                            <img
                              src={emp.photo.url}
                              alt={emp.firstName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>
                              {emp.firstName?.[0]}
                              {emp.fatherName?.[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {emp.firstName} {emp.fatherName}
                          </p>
                          <p className="text-xs text-slate-500">{emp.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary text-xs">{emp.departmentName}</span>
                    </td>
                    <td className="text-slate-600 text-sm">{emp.designationName}</td>
                    <td>
                      <span
                        className={`badge text-xs ${
                          emp.employmentType === 'Full-Time' ? 'badge-success' : 'badge-gray'
                        }`}
                      >
                        {emp.employmentType}
                      </span>
                    </td>
                    <td className="text-slate-500 text-xs">
                      {emp.joinDate
                        ? new Date(emp.joinDate).toLocaleDateString('en-ET', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td>
                      <span
                        className={`badge text-xs capitalize ${
                          emp.status === 'active'
                            ? 'badge-success'
                            : emp.status === 'on_leave'
                            ? 'badge-warning'
                            : 'badge-gray'
                        }`}
                      >
                        {emp.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/employees/${emp._id}`}
                          className="btn-icon btn-ghost"
                          title="View"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </Link>
                        {canManage && (
                          <>
                            <Link
                              to={`/employees/${emp._id}/edit`}
                              className="btn-icon btn-ghost"
                              title="Edit"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </Link>
                            {['super_admin', 'admin'].includes(user?.role) &&
                              emp.status === 'active' && (
                                <button
                                  onClick={() => setDeleteModal({ open: true, employee: emp })}
                                  className="btn-icon text-slate-400 hover:text-red-500 hover:bg-red-50"
                                  title="Deactivate"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                    />
                                  </svg>
                                </button>
                              )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {pagination.from}–{pagination.to} of {pagination.total}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => updateParam('page', String(page - 1))}
                disabled={!pagination.hasPreviousPage}
                className="btn-outline btn-sm disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-sm text-slate-600 px-2 py-1">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => updateParam('page', String(page + 1))}
                disabled={!pagination.hasNextPage}
                className="btn-outline btn-sm disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDeleteModal({ open: false, employee: null })}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-slide-up">
            <h3 className="text-base font-bold mb-2">Deactivate Employee</h3>
            <p className="text-sm text-slate-500 mb-6">
              Deactivate {deleteModal.employee?.firstName} {deleteModal.employee?.fatherName}?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, employee: null })}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteModal.employee?._id)}
                disabled={deleteMutation.isPending}
                className="btn-danger flex-1"
              >
                {deleteMutation.isPending ? <div className="spinner-sm" /> : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;
