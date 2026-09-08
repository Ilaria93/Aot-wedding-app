import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { DEV_UNLOCK_ALL_ROUTES } from '@/constants/devAccess';
import { useAuth } from '@/contexts/AuthContext';
import { requiresAuthentication } from '@/components/AuthGuard/authRouteAccess';
import './styles/AuthGuard.scss';

/** Redirects unauthenticated users away from protected routes. */
export function AuthGuard() {
  const { isAuthenticated, canManageWedding, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return <div className="loading-screen">…</div>;
  }

  if (!isAuthenticated && requiresAuthentication(location.pathname, DEV_UNLOCK_ALL_ROUTES)) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }

  if (!DEV_UNLOCK_ALL_ROUTES && isAuthenticated && location.pathname.startsWith('/auth/')) {
    return <Navigate to="/" replace />;
  }

  // The couple's account skips the public landing page entirely — it lands
  // straight on their control panel instead.
  if (canManageWedding && location.pathname === '/') {
    return <Navigate to="/admin/rsvp" replace />;
  }

  return <Outlet />;
}
