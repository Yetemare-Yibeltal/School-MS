import { Outlet } from 'react-router-dom';

const AuthLayout = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 flex items-center justify-center p-6">
    <div className="w-full max-w-md">
      <div className="text-center mb-8 text-white">
        <h1 className="text-3xl font-bold text-white">Kat Secondary School</h1>
        <p className="text-indigo-200 mt-1">ካት ሁለተኛ ደረጃ ትምህርት ቤት</p>
        <p className="text-indigo-300 text-sm">Addis Ababa, Ethiopia</p>
      </div>
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <Outlet />
      </div>
      <p className="text-center text-indigo-300 text-xs mt-6">
        &copy; {new Date().getFullYear()} Kat Secondary School Management System
      </p>
    </div>
  </div>
);

export default AuthLayout;
