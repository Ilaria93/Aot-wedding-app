import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { LoadingScreen } from '@/components/LoadingScreen';
import { requiresAuthentication } from '@/components/AuthGuard/authRouteAccess';
import { DEV_UNLOCK_ALL_ROUTES } from '@/constants/devAccess';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import './styles/AuthGuard.scss';

/** Redirects unauthenticated users away from protected routes. */
export function AuthGuard() {
  const { canManageWedding, isAuthenticated, isBootstrapping } = useAuth();
  const { t } = useI18n();
  const location = useLocation();

  if (isBootstrapping) {
    return <LoadingScreen label={t('common.loadingSession')} />;
  }

  if (!isAuthenticated && requiresAuthentication(location.pathname, DEV_UNLOCK_ALL_ROUTES)) {
    return <Navigate to="/auth/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  // Just logged in: this fires before the login page's own redirect, so it
  // must pick the same target (where they came from, else the couple's panel).
  if (!DEV_UNLOCK_ALL_ROUTES && isAuthenticated && location.pathname.startsWith('/auth/')) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? (canManageWedding ? '/admin/rsvp' : '/')} replace />;
  }

  return <Outlet />;
}
