import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const count = (v) => (Array.isArray(v) ? v.length : Number(v) || 0);

const HRMDashboardPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['hrm-dashboard'],
    queryFn: async () => (await api.get('/hrm/dashboard')).data.data,
  });

  const d = data || {};
  const cards = [
    ['Total staff', d.totalStaff, '/hrm/departments'],
    ['Teachers', d.totalTeachers, '/teachers'],
    ['Employees', d.totalEmployees, '/employees'],
    ['Pending leaves', count(d.pendingLeaves), '/hrm/leaves'],
    ['On leave now', count(d.currentlyOnLeave), '/hrm/leaves'],
  ];
  const deptStats = Array.isArray(d.departmentStats) ? d.departmentStats : [];
  const payroll = d.payrollStats && !Array.isArray(d.payrollStats) ? d.payrollStats : {};

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">HR Dashboard</h1>
          <p className="page-subtitle">Staff, leave and payroll overview</p>
        </div>
        <Link to="/hrm/payroll" className="btn-outline">
          Payroll
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map(([label, value, to]) => (
          <Link key={label} to={to} className="card p-4 hover:shadow-md">
            <p className="text-2xl font-bold text-slate-900">{isLoading ? '...' : value ?? 0}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Staff by department</h3>
          </div>
          <div className="card-body space-y-2">
            {deptStats.length === 0 && (
              <p className="text-sm text-slate-400">No department data.</p>
            )}
            {deptStats.map((x) => (
              <div key={x._id || x.name} className="flex justify-between text-sm">
                <span>{x.name || x.departmentName || x._id || '-'}</span>
                <b>{x.count ?? x.total ?? 0}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Payroll</h3>
          </div>
          <div className="card-body space-y-2">
            {Object.keys(payroll).length === 0 && (
              <p className="text-sm text-slate-400">No payroll data.</p>
            )}
            {Object.entries(payroll)
              .filter(([, v]) => typeof v !== 'object')
              .map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span>{k}</span>
                  <b>{String(v)}</b>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRMDashboardPage;
