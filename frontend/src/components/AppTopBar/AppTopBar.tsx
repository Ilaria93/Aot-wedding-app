import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const SHOW_AFTER_SCROLL = 88;

import { AppUserMenu } from '@/components/AppUserMenu';
import { AppUserMenuContent } from '@/components/AppUserMenu/AppUserMenuContent';
import { ScreenBackButton } from '@/components/ScreenBackButton';
import { WEDDING_COUPLE_NAMES, WEDDING_OPERATION_NAME } from '@/constants/weddingEvent';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslateFn } from '@/i18n/translations';
import './styles/AppTopBar.scss';

const APP_ROUTES = [
  { to: '/album', i18nKey: 'navigation.tabs.album' as const },
  { to: '/travel', i18nKey: 'navigation.tabs.travel' as const },
  { to: '/tema', i18nKey: 'navigation.tabs.tema' as const },
] as const;

const ADMIN_ROUTES = [
  { to: '/admin/rsvp', i18nKey: 'admin.nav.rsvp' as const },
  { to: '/admin/contacts', i18nKey: 'admin.nav.contacts' as const },
  { to: '/admin/gallery', i18nKey: 'admin.nav.gallery' as const },
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
function getNavItems(isHome: boolean, canManageWedding: boolean, t: TranslateFn): NavItem[] {
  if (isHome) {
    return HOME_ANCHORS.map((anchor) => ({
      key: anchor.href,
      label: t(`landing.nav.${anchor.labelKey}`),
      target: anchor.href,
      isAnchor: true,
    }));
  }

  // The couple only ever manages the wedding, never browses it as a guest —
  // no Album/Contatti/Tema, just their three control-panel sections.
  const routes = canManageWedding ? ADMIN_ROUTES : APP_ROUTES;
  return routes.map((route) => ({
    key: route.to,
    label: t(route.i18nKey),
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

/** Global sticky header — primary routes and account menu. */
export function AppTopBar() {
  const location = useLocation();
  const { t } = useI18n();
  const { canManageWedding } = useAuth();
  const isHome = location.pathname === '/';
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  /* Only the home page hides the bar: there it would cover the hero cover art.
     Every other screen needs its navigation from the first pixel. */
  const isVisible = !isHome || isScrolled;
  const navItems = getNavItems(isHome, canManageWedding, t);
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
          <AppUserMenuContent onNavigate={closeMobileNav} />
        </div>
      ) : null}
    </header>
  );
}
