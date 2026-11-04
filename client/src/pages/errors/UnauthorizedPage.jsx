import { Link } from 'react-router-dom';

const UnauthorizedPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
    <div>
      <p className="text-7xl font-black text-red-100">403</p>
      <h1 className="text-2xl font-bold mt-2">Access denied</h1>
      <p className="text-slate-500 mt-1 mb-6">Your role does not have access to this page.</p>
      <Link to="/dashboard" className="btn-primary">
        Go to Dashboard
      </Link>
    </div>
  </div>
);

export default UnauthorizedPage;
