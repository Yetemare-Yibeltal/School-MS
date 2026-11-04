import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const Stat = ({ label, value, icon }) => (
  <div className="card p-5">
    <div className="text-2xl mb-2">{icon}</div>
    <p className="text-2xl font-bold text-slate-900">{value ?? '...'}</p>
    <p className="text-sm text-slate-500">{label}</p>
  </div>
);

const money = (n) => `ETB ${Number(n || 0).toLocaleString()}`;

const DashboardPage = () => {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['system-dashboard'],
    queryFn: async () => (await api.get('/system/dashboard')).data.data,
  });

  if (isError)
    return (
      <div className="card p-8 text-center text-slate-500">
        Could not load the dashboard. Check that the API server is running.
      </div>
    );

  const o = data?.overview || {};
  const a = data?.alerts || {};
  const f = data?.finance || {};
  const att = data?.today?.attendance || {};
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold text-white">
          {greeting}, {user?.firstName}!
        </h2>
        <p className="text-indigo-200 text-sm mt-1">
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
          {data?.currentAcademicYear && ` · ${data.currentAcademicYear.name}`}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon="🎓" label="Active students" value={isLoading ? null : o.activeStudents} />
        <Stat icon="👨‍🏫" label="Teachers" value={isLoading ? null : o.totalTeachers} />
        <Stat icon="👔" label="Employees" value={isLoading ? null : o.totalEmployees} />
        <Stat
          icon="💰"
          label="Today's payments"
          value={isLoading ? null : money(data?.today?.payments?.total)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Today's attendance</h3>
          </div>
          <div className="card-body grid grid-cols-4 text-center gap-2">
            {[
              ['Present', att.present],
              ['Late', att.late],
              ['Absent', att.absent],
              ['Total', att.total],
            ].map(([l, v]) => (
              <div key={l}>
                <p className="text-xl font-bold text-slate-900">{v ?? 0}</p>
                <p className="text-xs text-slate-500">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">This month's finance</h3>
          </div>
          <div className="card-body space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Income</span>
              <b className="text-green-700">{money(f.monthlyIncome)}</b>
            </div>
            <div className="flex justify-between">
              <span>Expenses</span>
              <b className="text-red-700">{money(f.monthlyExpenses)}</b>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span>Net</span>
              <b>{money(f.netBalance)}</b>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Alerts</h3>
          </div>
          <div className="card-body space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Pending leaves</span>
              <b>{a.pendingLeaves ?? 0}</b>
            </div>
            <div className="flex justify-between">
              <span>Overdue books</span>
              <b>{a.overdueBooks ?? 0}</b>
            </div>
            <div className="flex justify-between">
              <span>Active suspensions</span>
              <b>{a.activeSuspensions ?? 0}</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
