import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
    <div>
      <p className="text-7xl font-black text-indigo-100">404</p>
      <h1 className="text-2xl font-bold mt-2">Page not found</h1>
      <p className="text-slate-500 mt-1 mb-6">
        The page you are looking for does not exist or is not built yet.
      </p>
      <Link to="/dashboard" className="btn-primary">
        Go to Dashboard
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
