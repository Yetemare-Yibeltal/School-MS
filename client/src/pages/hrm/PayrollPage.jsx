import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';

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
const money = (n) => `ETB ${Number(n || 0).toLocaleString()}`;

const PayrollPage = () => {
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ['payroll', month, year],
    queryFn: async () =>
      (await api.get(`/hrm/payroll?month=${month}&year=${year}&limit=100`)).data.data,
  });
  const payrolls = data?.payrolls || [];
  const batchId = payrolls.find((p) => p.batchId)?.batchId;

  const { data: years = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => (await api.get('/academic/years')).data.data.academicYears,
  });
  const currentYear = years.find((y) => y.isCurrent)?._id;

  const fail = (err) => toast.error(err.response?.data?.message || 'Request failed.');
  const refresh = () => qc.invalidateQueries({ queryKey: ['payroll'] });
  const act = (fn, msg) => ({
    mutationFn: fn,
    onSuccess: (res) => {
      toast.success(res?.data?.message || msg);
      refresh();
    },
    onError: fail,
  });

  const process = useMutation(
    act(
      () => api.post('/hrm/payroll/process', { month, year, academicYear: currentYear }),
      'Payroll processed.'
    )
  );
  const approveOne = useMutation(
    act((id) => api.post(`/hrm/payroll/${id}/approve`, {}), 'Approved.')
  );
  const approveAll = useMutation(
    act(() => api.post('/hrm/payroll/batch/approve', { batchId }), 'Batch approved.')
  );
  const paidOne = useMutation(
    act(
      (id) =>
        api.post(`/hrm/payroll/${id}/mark-paid`, {
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'Bank Transfer',
        }),
      'Marked as paid.'
    )
  );
  const paidAll = useMutation(
    act(
      () =>
        api.post('/hrm/payroll/batch/mark-paid', {
          batchId,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'Bank Transfer',
        }),
      'Batch marked as paid.'
    )
  );

  const name = (p) => {
    const s = p.teacher || p.employee;
    return s && typeof s === 'object'
      ? `${s.firstName || ''} ${s.fatherName || ''}`.trim()
      : p.staffName || '-';
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payroll</h1>
          <p className="page-subtitle">
            {MONTHS[month - 1]} {year}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="form-select w-36"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value, 10))}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <input
            type="number"
            className="form-input w-24"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10) || year)}
          />
          <button
            type="button"
            className="btn-primary"
            disabled={process.isPending}
            onClick={() =>
              window.confirm(`Process payroll for ${MONTHS[month - 1]} ${year}?`) &&
              process.mutate()
            }
          >
            {process.isPending ? 'Processing...' : 'Process payroll'}
          </button>
          {batchId && (
            <>
              <button
                type="button"
                className="btn-outline"
                disabled={approveAll.isPending}
                onClick={() => approveAll.mutate()}
              >
                Approve all
              </button>
              <button
                type="button"
                className="btn-outline"
                disabled={paidAll.isPending}
                onClick={() => paidAll.mutate()}
              >
                Mark all paid
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Basic</th>
                <th>Gross</th>
                <th>Net</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              )}
              {!isLoading && payrolls.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    No payroll for this month.
                  </td>
                </tr>
              )}
              {payrolls.map((p) => (
                <tr key={p._id}>
                  <td>{name(p)}</td>
                  <td>{money(p.basicSalary)}</td>
                  <td>{money(p.grossEarnings ?? p.grossSalary)}</td>
                  <td className="font-semibold">{money(p.netSalary)}</td>
                  <td className="capitalize">{p.isPaid ? 'paid' : p.status}</td>
                  <td className="text-right space-x-2">
                    {!p.isPaid && p.status !== 'approved' && (
                      <button
                        type="button"
                        className="btn-outline btn-sm"
                        onClick={() => approveOne.mutate(p._id)}
                      >
                        Approve
                      </button>
                    )}
                    {!p.isPaid && p.status === 'approved' && (
                      <button
                        type="button"
                        className="btn-success btn-sm"
                        onClick={() => paidOne.mutate(p._id)}
                      >
                        Mark paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayrollPage;
