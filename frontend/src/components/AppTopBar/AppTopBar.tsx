import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const SHOW_AFTER_SCROLL = 88;

import { AppUserMenu } from '@/components/AppUserMenu';
import { ScreenBackButton } from '@/components/ScreenBackButton';
import { WEDDING_COUPLE_NAMES, WEDDING_OPERATION_NAME } from '@/constants/weddingEvent';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslateFn } from '@/i18n/translations';
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

type NavItem = {
  key: string;
  label: string;
  target: string;
  /** Home renders in-page anchors; every other screen renders real routes. */
  isAnchor: boolean;
};

/**
 * Which links belong in the nav — the one place that answers "what shows on
 * this screen", so the desktop bar and the mobile panel can't drift apart.
 */
function getNavItems(isHome: boolean, t: TranslateFn): NavItem[] {
  return isHome
    ? HOME_ANCHORS.map((anchor) => ({
        key: anchor.href,
        label: t(`landing.nav.${anchor.labelKey}`),
        target: anchor.href,
        isAnchor: true,
      }))
    : APP_ROUTES.map((route) => ({
        key: route.to,
        label: t(`navigation.tabs.${route.labelKey}`),
        target: route.to,
        isAnchor: false,
      }));
}

type NavItemLinkProps = {
  item: NavItem;
  className: string;
  activeClassName?: string;
  onNavigate: () => void;
};

/** Renders one nav item as an in-page anchor or a router link, same data either way. */
function NavItemLink({ item, className, activeClassName, onNavigate }: NavItemLinkProps) {
  if (item.isAnchor) {
    return (
      <a href={item.target} className={className} onClick={onNavigate}>
        {item.label}
      </a>
    );
  }

  return (
    <NavLink
      to={item.target}
      className={({ isActive }) => `${className}${isActive && activeClassName ? ` ${activeClassName}` : ''}`}
      onClick={onNavigate}>
      {item.label}
    </NavLink>
  );
}

/** Global sticky header — primary routes, RSVP CTA and account menu. */
export function AppTopBar() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  const isHome = location.pathname === '/';
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  /* Only the home page hides the bar: there it would cover the hero cover art.
     Every other screen needs its navigation from the first pixel. */
  const isVisible = !isHome || isScrolled;
  const navItems = getNavItems(isHome, t);
  const closeMobileNav = () => setMobileNavOpen(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > SHOW_AFTER_SCROLL);
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <header
      className={`obw-nav site-header${isHome ? ' site-header--overlay' : ''}${isVisible ? ' site-header--visible' : ''}`}>
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
            {navItems.map((item) => (
              <NavItemLink
                key={item.key}
                item={item}
                className="obw-nav__link obw-nav__link--animated site-header__route"
                activeClassName="is-active"
                onNavigate={closeMobileNav}
              />
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
          {navItems.map((item) => (
            <NavItemLink
              key={item.key}
              item={item}
              className="site-header__mobile-link"
              activeClassName="is-active"
              onNavigate={closeMobileNav}
            />
          ))}
          {isHome ? (
            <a
              className="obw-btn obw-btn--primary obw-btn--block site-header__mobile-cta"
              href="#rsvp"
              onClick={closeMobileNav}>
              {t('navigation.stack.rsvp')}
            </a>
          ) : (
            <NavLink
              to={isAuthenticated ? '/rsvp' : '/auth/login'}
              className="obw-btn obw-btn--primary obw-btn--block site-header__mobile-cta"
              onClick={closeMobileNav}>
              {t('navigation.stack.rsvp')}
            </NavLink>
          )}
        </div>
      ) : null}
    </header>
  );
}
