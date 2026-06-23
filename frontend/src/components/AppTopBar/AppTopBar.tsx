import { Link, NavLink, useLocation } from 'react-router-dom';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ScreenBackButton } from '@/components/ScreenBackButton';
import { WEDDING_COUPLE_NAMES, WEDDING_OPERATION_NAME } from '@/constants/weddingEvent';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import './styles/AppTopBar.scss';

const APP_ROUTES = [
  { to: '/album', labelKey: 'album' as const },
  { to: '/travel', labelKey: 'travel' as const },
] as const;

/** Global sticky header — sole navigation (no bottom tab bar). */
export function AppTopBar() {
  const location = useLocation();
  const { isAuthenticated, canManageWedding } = useAuth();
  const { t } = useI18n();
  const isHome = location.pathname === '/';

  return (
    <header className="obw-nav site-header">
      <div className="obw-nav__inner site-header__inner">
        <div className="site-header__start">
          {!isHome ? <ScreenBackButton fallback="/" /> : null}
          <Link className="obw-nav__brand site-header__brand" to="/">
            <span className="obw-nav__brand-title">{WEDDING_OPERATION_NAME}</span>
            <span className="obw-nav__brand-sub">{WEDDING_COUPLE_NAMES}</span>
          </Link>
        </div>

        <nav className="obw-nav__links site-header__nav" aria-label={t('navigation.tabs.home')}>
          {APP_ROUTES.map((route) => (
            <NavLink
              key={route.to}
              to={route.to}
              className={({ isActive }) =>
                `obw-nav__link site-header__route${isActive ? ' is-active' : ''}`
              }>
              {t(`navigation.tabs.${route.labelKey}`)}
            </NavLink>
          ))}

          <NavLink
            to={isAuthenticated ? '/rsvp' : '/auth/login'}
            className={({ isActive }) =>
              `obw-btn obw-btn--primary obw-nav__cta site-header__route${isActive ? ' is-active' : ''}`
            }>
            {t('navigation.stack.rsvp')}
          </NavLink>

          <NavLink
            to={isAuthenticated ? '/profile' : '/auth/login'}
            className={({ isActive }) =>
              `obw-nav__link site-header__route${isActive ? ' is-active' : ''}`
            }>
            {t(isAuthenticated ? 'navigation.tabs.profile' : 'navigation.stack.login')}
          </NavLink>

          {isAuthenticated && canManageWedding ? (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `obw-nav__link site-header__route${isActive ? ' is-active' : ''}`
              }>
              {t('navigation.tabs.admin')}
            </NavLink>
          ) : null}

          <LanguageSwitcher compact />
        </nav>
      </div>
    </header>
  );
}
