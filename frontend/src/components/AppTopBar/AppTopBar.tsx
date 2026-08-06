import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

import { AppUserMenu } from '@/components/AppUserMenu';
import { ScreenBackButton } from '@/components/ScreenBackButton';
import { WEDDING_COUPLE_NAMES, WEDDING_OPERATION_NAME } from '@/constants/weddingEvent';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import './styles/AppTopBar.scss';

const APP_ROUTES = [
  { to: '/album', labelKey: 'album' as const },
  { to: '/travel', labelKey: 'travel' as const },
] as const;

const HOME_ANCHORS = [
  { href: '#story', labelKey: 'story' as const },
  { href: '#gallery', labelKey: 'gallery' as const },
  { href: '#ceremony', labelKey: 'ceremony' as const },
  { href: '#rsvp', labelKey: 'rsvp' as const },
  { href: '#gift', labelKey: 'gift' as const },
  { href: '#faq', labelKey: 'faq' as const },
  { href: '#contacts', labelKey: 'contacts' as const },
] as const;

/** Global sticky header — primary routes, RSVP CTA and account menu. */
export function AppTopBar() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  const isHome = location.pathname === '/';
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileNavOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileNavOpen]);

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

        <div className="site-header__end">
          <nav
            className="obw-nav__links site-header__nav site-header__nav--desktop"
            aria-label={t('navigation.menu.primary')}>
            {isHome
              ? HOME_ANCHORS.map((anchor) => (
                  <a
                    key={anchor.href}
                    href={anchor.href}
                    className="obw-nav__link obw-nav__link--animated site-header__route"
                    onClick={() => setMobileNavOpen(false)}>
                    {t(`landing.nav.${anchor.labelKey}`)}
                  </a>
                ))
              : APP_ROUTES.map((route) => (
                  <NavLink
                    key={route.to}
                    to={route.to}
                    className={({ isActive }) =>
                      `obw-nav__link obw-nav__link--animated site-header__route${isActive ? ' is-active' : ''}`
                    }>
                    {t(`navigation.tabs.${route.labelKey}`)}
                  </NavLink>
                ))}

            {isHome ? (
              <a className="obw-btn obw-btn--primary obw-nav__cta site-header__route" href="#rsvp">
                {t('navigation.stack.rsvp')}
              </a>
            ) : (
              <NavLink
                to={isAuthenticated ? '/rsvp' : '/auth/login'}
                className={({ isActive }) =>
                  `obw-btn obw-btn--primary obw-nav__cta site-header__route${isActive ? ' is-active' : ''}`
                }>
                {t('navigation.stack.rsvp')}
              </NavLink>
            )}
          </nav>

          <button
            type="button"
            className={`site-header__menu-btn${mobileNavOpen ? ' is-open' : ''}`}
            aria-expanded={mobileNavOpen}
            aria-controls="site-header-mobile-panel"
            aria-label={mobileNavOpen ? t('navigation.menu.close') : t('navigation.menu.open')}
            onClick={() => setMobileNavOpen((current) => !current)}>
            {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <AppUserMenu />
        </div>
      </div>

      {mobileNavOpen ? (
        <div
          id="site-header-mobile-panel"
          className="site-header__mobile-panel obw-fade-up"
          aria-label={t('navigation.menu.primary')}>
          {isHome
            ? HOME_ANCHORS.map((anchor) => (
                <a
                  key={anchor.href}
                  href={anchor.href}
                  className="site-header__mobile-link"
                  onClick={() => setMobileNavOpen(false)}>
                  {t(`landing.nav.${anchor.labelKey}`)}
                </a>
              ))
            : APP_ROUTES.map((route) => (
                <NavLink
                  key={route.to}
                  to={route.to}
                  className={({ isActive }) =>
                    `site-header__mobile-link${isActive ? ' is-active' : ''}`
                  }
                  onClick={() => setMobileNavOpen(false)}>
                  {t(`navigation.tabs.${route.labelKey}`)}
                </NavLink>
              ))}
          {isHome ? (
            <a
              className="obw-btn obw-btn--primary obw-btn--block site-header__mobile-cta"
              href="#rsvp"
              onClick={() => setMobileNavOpen(false)}>
              {t('navigation.stack.rsvp')}
            </a>
          ) : (
            <NavLink
              to={isAuthenticated ? '/rsvp' : '/auth/login'}
              className="obw-btn obw-btn--primary obw-btn--block site-header__mobile-cta"
              onClick={() => setMobileNavOpen(false)}>
              {t('navigation.stack.rsvp')}
            </NavLink>
          )}
        </div>
      ) : null}
    </header>
  );
}
