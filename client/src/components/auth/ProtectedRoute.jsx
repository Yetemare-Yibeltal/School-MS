import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  if (!isAuthenticated || !user)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (roles && roles.length > 0 && !roles.includes(user.role))
    return <Navigate to="/unauthorized" replace />;
  return children;
};

export default ProtectedRoute;
