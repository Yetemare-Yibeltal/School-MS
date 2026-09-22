// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// PAYROLL PAGE
// kat-school/client/src/pages/hrm/PayrollPage.jsx
// ============================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const PayrollPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const month = parseInt(searchParams.get('month') || String(currentMonth));
  const year = parseInt(searchParams.get('year') || String(currentYear));
  const staffType = searchParams.get('staffType') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const [generating, setGenerating] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    value ? next.set(key, value) : next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['payroll-list', { month, year, staffType, page }],
    queryFn: async () => {
      const params = new URLSearchParams({
        month,
        year,
        page,
        limit: 25,
        ...(staffType && { staffType }),
      });
      const res = await api.get(`/hrm/payroll?${params}`);
      return res.data;
    },
    keepPreviousData: true,
  });

  const approveMutation = useMutation({
    mutationFn: (ids) => api.post('/hrm/payroll/batch-approve', { payrollIds: ids }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Payroll approved.');
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['payroll-list'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const markPaidMutation = useMutation({
    mutationFn: (ids) => api.post('/hrm/payroll/batch-paid', { payrollIds: ids }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Payroll marked as paid.');
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['payroll-list'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const handleGeneratePayroll = async () => {
    if (!confirm(`Generate payroll for ${MONTHS[month - 1]} ${year}?`)) return;
    setGenerating(true);
    try {
      const res = await api.post('/hrm/payroll/process', {
        month,
        year,
        staffType: staffType || undefined,
      });
      toast.success(res.data.message || 'Payroll generated!');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payroll generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const payrolls = data?.data?.payrolls || [];
  const pagination = data?.pagination || {};
  const summary = data?.data?.summary || {};
  const canManage = ['super_admin', 'admin', 'hr_manager'].includes(user?.role);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === payrolls.length) setSelectedIds([]);
    else setSelectedIds(payrolls.map((p) => p._id));
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payroll Management</h1>
          <p className="page-subtitle">
            {MONTHS[month - 1]} {year} payroll
          </p>
        </div>
        {canManage && (
          <button onClick={handleGeneratePayroll} disabled={generating} className="btn-primary">
            {generating ? (
              <>
                <div className="spinner-sm" /> Generating...
              </>
            ) : (
              '⚙️ Generate Payroll'
            )}
          </button>
        )}
      </div>

      {/* Summary */}
      {summary.totalNetSalary !== undefined && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Records', value: summary.count || 0, color: 'bg-slate-50 border-slate-200' },
            {
              label: 'Gross Earnings',
              value: `ETB ${Number(summary.totalGross || 0).toLocaleString()}`,
              color: 'bg-indigo-50 border-indigo-200',
            },
            {
              label: 'Total Tax',
              value: `ETB ${Number(summary.totalTax || 0).toLocaleString()}`,
              color: 'bg-red-50 border-red-200',
            },
            {
              label: 'Net Salary',
              value: `ETB ${Number(summary.totalNetSalary || 0).toLocaleString()}`,
              color: 'bg-green-50 border-green-200',
            },
            { label: 'Paid', value: summary.paid || 0, color: 'bg-teal-50 border-teal-200' },
          ].map((stat) => (
            <div key={stat.label} className={`p-3 rounded-xl border ${stat.color} text-center`}>
              <p className="text-lg font-bold text-slate-900 truncate">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="form-group mb-0">
            <label className="form-label text-xs">Month</label>
            <select
              value={month}
              onChange={(e) => updateParam('month', e.target.value)}
              className="form-select w-32"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group mb-0">
            <label className="form-label text-xs">Year</label>
            <select
              value={year}
              onChange={(e) => updateParam('year', e.target.value)}
              className="form-select w-24"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group mb-0 flex items-end">
            <select
              value={staffType}
              onChange={(e) => updateParam('staffType', e.target.value)}
              className="form-select w-32"
            >
              <option value="">All Staff</option>
              <option value="teacher">Teachers</option>
              <option value="employee">Employees</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {canManage && selectedIds.length > 0 && (
            <div className="flex items-end gap-2">
              <button
                onClick={() => approveMutation.mutate(selectedIds)}
                disabled={approveMutation.isPending}
                className="btn-primary btn-sm"
              >
                {approveMutation.isPending ? (
                  <div className="spinner-sm" />
                ) : (
                  `✓ Approve (${selectedIds.length})`
                )}
              </button>
              <button
                onClick={() => markPaidMutation.mutate(selectedIds)}
                disabled={markPaidMutation.isPending}
                className="btn-success btn-sm"
              >
                {markPaidMutation.isPending ? (
                  <div className="spinner-sm" />
                ) : (
                  `💰 Mark Paid (${selectedIds.length})`
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payroll Table */}
      <div className="card overflow-hidden">
        <div className="table-container rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                {canManage && (
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === payrolls.length && payrolls.length > 0}
                      onChange={toggleSelectAll}
                      className="form-checkbox"
                    />
                  </th>
                )}
                <th>Staff</th>
                <th>Type</th>
                <th>Basic Salary</th>
                <th>Gross</th>
                <th>Income Tax</th>
                <th>Pension (Emp.)</th>
                <th>Net Salary</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j}>
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : payrolls.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <div className="text-4xl mb-3">💼</div>
                    <p className="text-slate-500 font-medium">No payroll records for this period</p>
                    {canManage && (
                      <button
                        onClick={handleGeneratePayroll}
                        disabled={generating}
                        className="btn-primary mt-4"
                      >
                        Generate Payroll
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                payrolls.map((payroll) => (
                  <tr
                    key={payroll._id}
                    className={`hover:bg-slate-50 ${payroll.isPaid ? 'bg-green-50/10' : ''}`}
                  >
                    {canManage && (
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(payroll._id)}
                          onChange={() => toggleSelect(payroll._id)}
                          className="form-checkbox"
                        />
                      </td>
                    )}
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-700 font-semibold text-xs">
                          {payroll.staffName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{payroll.staffName}</p>
                          <p className="text-xs text-slate-400">{payroll.staffId}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge text-xs capitalize ${
                          payroll.staffType === 'teacher' ? 'badge-primary' : 'badge-gray'
                        }`}
                      >
                        {payroll.staffType}
                      </span>
                    </td>
                    <td className="text-sm">ETB {Number(payroll.basicSalary).toLocaleString()}</td>
                    <td className="text-sm font-medium">
                      ETB {Number(payroll.grossEarnings).toLocaleString()}
                    </td>
                    <td className="text-sm text-red-600">
                      ETB {Number(payroll.incomeTax).toLocaleString()}
                    </td>
                    <td className="text-sm text-amber-600">
                      ETB {Number(payroll.employeePension).toLocaleString()}
                    </td>
                    <td className="text-sm font-bold text-green-700">
                      ETB {Number(payroll.netSalary).toLocaleString()}
                    </td>
                    <td>
                      {payroll.isPaid ? (
                        <span className="badge badge-success text-xs">Paid</span>
                      ) : payroll.status === 'approved' ? (
                        <span className="badge badge-info text-xs">Approved</span>
                      ) : payroll.status === 'draft' ? (
                        <span className="badge badge-warning text-xs">Draft</span>
                      ) : (
                        <span className="badge badge-gray text-xs capitalize">
                          {payroll.status}
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      {canManage && !payroll.isPaid && (
                        <div className="flex items-center justify-end gap-1">
                          {payroll.status === 'draft' && (
                            <button
                              onClick={() => approveMutation.mutate([payroll._id])}
                              className="btn-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-2 py-1 text-xs hover:bg-blue-100"
                            >
                              Approve
                            </button>
                          )}
                          {payroll.status === 'approved' && (
                            <button
                              onClick={() => markPaidMutation.mutate([payroll._id])}
                              className="btn-sm bg-green-50 text-green-700 border border-green-200 rounded-lg px-2 py-1 text-xs hover:bg-green-100"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      )}
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
              <span className="text-sm px-2 py-1 text-slate-600">
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
    </div>
  );
};

export default PayrollPage;
