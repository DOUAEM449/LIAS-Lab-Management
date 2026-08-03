import { Navigate } from 'react-router-dom';
import { hasRole } from '../utils/roles';

export default function RequireRole({ user, roles, children }) {
  if (!hasRole(user, roles)) {
    return <Navigate to="/admin" replace />;
  }
  return children;
}
