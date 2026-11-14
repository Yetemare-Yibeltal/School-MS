import { Navigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '../../store/authStore';

const PublicRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();
  if (isAuthenticated) {
    return <Navigate to={location.state?.from || '/dashboard'} replace />;
  }
  return children;
};

export default PublicRoute;
