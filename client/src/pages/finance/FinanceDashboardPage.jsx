import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const first = (v) => (Array.isArray(v) ? v[0] || {} : v || {});
const list = (v) => (Array.isArray(v) ? v : []);
const money = (n) => `ETB ${Number(n || 0).toLocaleString()}`;
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-GB') : '-');
const personName = (x) =>
  x.studentName ||
  (x.student && typeof x.student === 'object'
    ? `${x.student.firstName || ''} ${x.student.fatherName || ''}`.trim()
    : '') ||
  '-';
const feeName = (x) =>
  x.feeTypeName || (x.feeType && typeof x.feeType === 'object' ? x.feeType.name : '') || '-';

const StatCard = ({ title, value, hint, icon, to }) => {
  const body = (
    <div className={`card p-5 ${to ? 'hover:shadow-md transition-shadow' : ''}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-600">{title}</p>
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
};

const FinanceDashboardPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['finance-dashboard'],
    queryFn: async () => (await api.get('/finance/dashboard')).data.data,
  });

  if (isLoading) {
    return <div className="card p-10 text-center text-slate-400">Loading dashboard...</div>;
  }

  const income = first(data?.incomeStats);
  const expense = first(data?.expenseStats);
  const payment = first(data?.paymentStats);
  const fee = first(data?.feeCollectionRate);

  const totalIncome = income.total ?? income.totalAmount ?? 0;
  const totalExpense = expense.total ?? expense.totalAmount ?? 0;
  const assigned = fee.totalAssigned ?? fee.totalNetAmount ?? 0;
  const collected = fee.totalCollected ?? fee.totalPaid ?? payment.totalAmount ?? 0;
  const outstanding = Math.max(assigned - collected, 0);
  const rate = assigned > 0 ? Math.round((collected / assigned) * 100) : 0;
  const net = totalIncome - totalExpense;

  const recent = list(data?.recentPayments);
  const overdue = list(data?.overdueAssignments);
  const incomeByCategory = list(data?.incomeByCategory);
  const expenseByCategory = list(data?.expenseByCategory);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Finance Dashboard</h1>
          <p className="page-subtitle">Income, expenses and fee collection</p>
        </div>
        <div className="flex gap-2">
          <Link to="/finance/fee-collection" className="btn-primary">
            Collect fee
          </Link>
          <Link to="/finance/payments" className="btn-outline">
            Payments
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="📈" title="Total income" value={money(totalIncome)} to="/finance/income" />
        <StatCard
          icon="📉"
          title="Total expenses"
          value={money(totalExpense)}
          to="/finance/expenses"
        />
        <StatCard
          icon="💳"
          title="Fees collected"
          value={money(collected)}
          hint={`${rate}% collection rate`}
          to="/finance/fee-collection"
        />
        <StatCard
          icon="⏳"
          title="Outstanding fees"
          value={money(outstanding)}
          hint="Pending collection"
          to="/finance/fee-collection"
        />
      </div>

      <div
        className={`rounded-2xl p-5 text-white ${
          net >= 0
            ? 'bg-gradient-to-r from-green-600 to-emerald-600'
            : 'bg-gradient-to-r from-red-600 to-rose-600'
        }`}
      >
        <p className="text-sm text-white/80">Net balance (income minus expenses)</p>
        <p className="text-3xl font-black mt-1">{money(Math.abs(net))}</p>
        <p className="text-sm text-white/80 mt-0.5">{net >= 0 ? 'Surplus' : 'Deficit'}</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold">Fee collection progress</h3>
          <span className="text-sm font-semibold">{rate}%</span>
        </div>
        <div className="card-body">
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                rate >= 75 ? 'bg-green-500' : rate >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(rate, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>Collected: {money(collected)}</span>
            <span>Assigned: {money(assigned)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Income by category</h3>
          </div>
          <div className="card-body space-y-2">
            {incomeByCategory.length === 0 && (
              <p className="text-sm text-slate-400">No income recorded.</p>
            )}
            {incomeByCategory.map((c, i) => (
              <div key={c._id || i} className="flex justify-between text-sm">
                <span>{c.category || c.name || c._id || 'Other'}</span>
                <b className="text-green-700">{money(c.total ?? c.amount)}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Expenses by category</h3>
          </div>
          <div className="card-body space-y-2">
            {expenseByCategory.length === 0 && (
              <p className="text-sm text-slate-400">No expenses recorded.</p>
            )}
            {expenseByCategory.map((c, i) => (
              <div key={c._id || i} className="flex justify-between text-sm">
                <span>{c.categoryName || c.category || c.name || c._id || 'Other'}</span>
                <b className="text-red-700">{money(c.total ?? c.amount)}</b>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold">Recent payments</h3>
          <Link to="/finance/payments" className="text-xs text-indigo-600">
            View all
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recent.length === 0 && (
            <p className="p-6 text-sm text-slate-400 text-center">No payments yet.</p>
          )}
          {recent.map((p) => (
            <div key={p._id} className="flex items-center gap-3 px-5 py-3">
              <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 font-semibold text-sm flex items-center justify-center">
                {personName(p)[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{personName(p)}</p>
                <p className="text-xs text-slate-400">
                  {feeName(p)} · {p.receiptNumber || '-'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-700">{money(p.amount)}</p>
                <p className="text-xs text-slate-400">{p.method}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-red-700">Overdue fees</h3>
          <span className="badge badge-danger">{overdue.length}</span>
        </div>
        <div className="table-container rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Fee</th>
                <th>Balance</th>
                <th>Due date</th>
                <th>Days late</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {overdue.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Nothing overdue.
                  </td>
                </tr>
              )}
              {overdue.map((a) => {
                const days = a.dueDate
                  ? Math.floor((Date.now() - new Date(a.dueDate)) / 86400000)
                  : 0;
                return (
                  <tr key={a._id}>
                    <td>{personName(a)}</td>
                    <td>{feeName(a)}</td>
                    <td className="text-red-600 font-semibold">
                      {money(a.remainingAmount ?? a.balance)}
                    </td>
                    <td>{fmt(a.dueDate)}</td>
                    <td>
                      <span className="badge badge-danger">{days}d</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboardPage;
