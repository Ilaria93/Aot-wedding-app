import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { DEV_UNLOCK_ALL_ROUTES } from '@/constants/devAccess';
import { useAuth } from '@/contexts/AuthContext';

const PUBLIC_PATHS = new Set(['/', '/auth/login', '/auth/register']);
const PUBLIC_PREFIXES = ['/rsvp/'];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) {
    return true;
  }

  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** Redirects unauthenticated users away from protected routes. */
export function AuthGuard() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return <div className="loading-screen">…</div>;
  }

  if (!DEV_UNLOCK_ALL_ROUTES && !isAuthenticated && !isPublicPath(location.pathname)) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }

  if (!DEV_UNLOCK_ALL_ROUTES && isAuthenticated && location.pathname.startsWith('/auth/')) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
