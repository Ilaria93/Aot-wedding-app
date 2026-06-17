import { Link, NavLink, useLocation } from 'react-router-dom';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ScreenBackButton } from '@/components/ScreenBackButton';
import { WEDDING_COUPLE_NAMES, WEDDING_OPERATION_NAME } from '@/constants/weddingEvent';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import './styles/AppTopBar.scss';

const APP_ROUTES = [
  { to: '/', labelKey: 'home' as const, end: true },
  { to: '/album', labelKey: 'album' as const },
  { to: '/travel', labelKey: 'travel' as const },
  { to: '/profile', labelKey: 'profile' as const },
] as const;

const LANDING_SECTIONS = ['story', 'ceremony', 'rsvp', 'gift'] as const;

/** Global sticky header — sole navigation (no bottom tab bar). */
export function AppTopBar() {
  const location = useLocation();
  const { canManageWedding } = useAuth();
  const { t } = useI18n();
  const isHome = location.pathname === '/';

  function scrollToSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="site-header__start">
          {!isHome ? <ScreenBackButton fallback="/" /> : null}
          <Link className="site-header__brand" to="/">
            <span className="site-header__title">{WEDDING_COUPLE_NAMES}</span>
            <span className="site-header__subtitle">{WEDDING_OPERATION_NAME}</span>
          </Link>
        </div>

        <nav className="site-header__nav" aria-label={t('navigation.tabs.home')}>
          {isHome
            ? LANDING_SECTIONS.map((sectionId) => (
                <button
                  key={sectionId}
                  type="button"
                  className="site-header__link"
                  onClick={() => scrollToSection(sectionId)}>
                  {t(`landing.nav.${sectionId}`)}
                </button>
              ))
            : null}

          {APP_ROUTES.map((route) => (
            <NavLink
              key={route.to}
              to={route.to}
              end={'end' in route ? route.end : false}
              className={({ isActive }) =>
                `site-header__route${isActive ? ' active' : ''}`
              }>
              {t(`navigation.tabs.${route.labelKey}`)}
            </NavLink>
          ))}

          {canManageWedding ? (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `site-header__route${isActive ? ' active' : ''}`
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
