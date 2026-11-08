import { BookHeart, CircleHelp, Contact, Gift, Home, Image as ImageIcon, LayoutDashboard, LogOut, MapPin, Send, Shield, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ComponentType } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

const SHOW_AFTER_SCROLL = 88;

import { AppUserMenu } from '@/components/AppUserMenu';
import { AppUserMenuContent } from '@/components/AppUserMenu/AppUserMenuContent';
import { ScreenBackButton } from '@/components/ScreenBackButton';
import { WEDDING_COUPLE_NAMES, WEDDING_OPERATION_NAME } from '@/constants/weddingEvent';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslateFn } from '@/i18n/translations';
import './styles/AppTopBar.scss';

type NavIcon = ComponentType<{ size?: number; 'aria-hidden'?: boolean }>;

const ADMIN_ROUTES: {
  to: string;
  i18nKey: 'navigation.tabs.home' | 'admin.nav.rsvp' | 'admin.nav.contacts' | 'admin.nav.gallery' | 'admin.nav.invites';
  icon: NavIcon;
}[] = [
  // "Home" is the guest site itself, so the couple can see it without logging out.
  { to: '/', i18nKey: 'navigation.tabs.home', icon: Home },
  { to: '/admin/rsvp', i18nKey: 'admin.nav.rsvp', icon: LayoutDashboard },
  { to: '/admin/invites', i18nKey: 'admin.nav.invites', icon: Send },
  { to: '/admin/contacts', i18nKey: 'admin.nav.contacts', icon: Contact },
  { to: '/admin/gallery', i18nKey: 'admin.nav.gallery', icon: ImageIcon },
];

// Same order as the sections on the home page — keep the two in step.
// Icons only show in the phone section tag.
const HOME_ANCHORS = [
  { href: '#theme', i18nKey: 'navigation.tabs.tema', icon: Shield },
  { href: '#story', i18nKey: 'landing.nav.story', icon: BookHeart },
  { href: '#ceremony', i18nKey: 'landing.nav.ceremony', icon: MapPin },
  // Gallery temporarily hidden from the home page — uncomment together with <GallerySection /> in HomePage.
  // { href: '#gallery', i18nKey: 'landing.nav.gallery', icon: ImageIcon },
  { href: '#rsvp', i18nKey: 'landing.nav.rsvp', icon: Mail },
  { href: '#gift', i18nKey: 'landing.nav.gift', icon: Gift },
  { href: '#faq', i18nKey: 'landing.nav.faq', icon: CircleHelp },
  { href: '#contacts', i18nKey: 'landing.nav.contacts', icon: Contact },
] as const;

type NavItem = {
  key: string;
  label: string;
  target: string;
  /** Home-section anchors render as <a>; page routes as router links. */
  isAnchor: boolean;
  icon?: NavIcon;
};

/**
 * Which links belong in the nav — the one place that answers "what shows on
 * this screen", so the desktop bar and the mobile panel can't drift apart.
 */
function getNavItems(isHome: boolean, canManageWedding: boolean, t: TranslateFn): NavItem[] {
  // Once logged in the couple keep their own nav on every page, guest site included.
  if (canManageWedding) {
    return ADMIN_ROUTES.map((route) => ({
      key: route.to,
      label: t(route.i18nKey),
      target: route.to,
      isAnchor: false,
      icon: route.icon,
    }));
  }

  // Everyone else sees the home sections on every page. Off the home page the
  // anchors point back at it ("/#story"), a plain load that lands on the section.
  return HOME_ANCHORS.map((anchor) => ({
    key: anchor.href,
    label: t(anchor.i18nKey),
    target: isHome ? anchor.href : `/${anchor.href}`,
    isAnchor: true,
  }));
}

type NavItemLinkProps = {
  item: NavItem;
  className: string;
  activeClassName?: string;
  /** Anchors only — route links work out their own active state. */
  isActive?: boolean;
  onNavigate: () => void;
};

/** Renders one nav item as an in-page anchor or a router link, same data either way. */
function NavItemLink({ item, className, activeClassName, isActive, onNavigate }: NavItemLinkProps) {
  const content = (
    <>
      {item.icon ? <item.icon size={16} aria-hidden /> : null}
      <span>{item.label}</span>
    </>
  );

  if (item.isAnchor) {
    return (
      <a
        href={item.target}
        className={`${className}${isActive && activeClassName ? ` ${activeClassName}` : ''}`}
        onClick={onNavigate}>
        {content}
      </a>
    );
  }

  return (
    <NavLink
      to={item.target}
      end={item.target === '/'}
      className={({ isActive }) => `${className}${isActive && activeClassName ? ` ${activeClassName}` : ''}`}
      onClick={onNavigate}>
      {content}
    </NavLink>
  );
}

/** Global sticky header — primary routes and account menu. */
export function AppTopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { canManageWedding, signOut } = useAuth();
  const isHome = location.pathname === '/';
  // The couple's desktop nav folds sign-out into the pill row instead of a
  // separate account dropdown — there's nothing else in that menu for them.
  const showSignOutPill = canManageWedding;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeAnchor, setActiveAnchor] = useState('');
  // Phones name where you are in a lilac tag beside the crest (the menu button):
  // the couple's panel section, or for guests the home section on screen.
  const adminRoute = ADMIN_ROUTES.find((route) => route.to !== '/' && location.pathname.startsWith(route.to));
  const guestAnchor = HOME_ANCHORS.find((anchor) =>
    location.pathname === '/tema' ? anchor.href === '#theme' : anchor.href === activeAnchor,
  );
  const currentSection =
    canManageWedding && adminRoute
      ? { icon: adminRoute.icon, label: t(adminRoute.i18nKey) }
      : !canManageWedding && guestAnchor
        ? { icon: guestAnchor.icon, label: t(guestAnchor.i18nKey) }
        : { icon: Home, label: t('navigation.tabs.home') };
  /* Only the home page hides the bar: there it would cover the hero cover art.
     Every other screen needs its navigation from the first pixel. */
  const isVisible = !isHome || isScrolled;
  const navItems = getNavItems(isHome, canManageWedding, t);
  const closeMobileNav = () => setMobileNavOpen(false);
  // One pill style everywhere; guests get the soft translucent variant, the
  // couple's control panel keeps the bright gold one.
  const desktopLinkClassName = 'obw-nav__link obw-nav__link--pill site-header__route';
  const desktopNavClassName = `obw-nav__links obw-nav__links--pill${showSignOutPill ? '' : ' obw-nav__links--soft'}`;

  async function handleSignOut() {
    // Leave first: signing out on an admin page would bounce to the login.
    navigate('/');
    await signOut();
  }

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > SHOW_AFTER_SCROLL);
      // Scroll-spy: the last home section whose top has passed 40% of the viewport.
      // Off the home page none of these exist, so nothing is highlighted.
      let current = '';
      for (const anchor of HOME_ANCHORS) {
        const section = document.querySelector(anchor.href);
        if (section && section.getBoundingClientRect().top <= window.innerHeight * 0.4) {
          current = anchor.href;
        }
      }
      // The last section is too short to ever reach that line: once it is fully
      // on screen it wins. Measured on the section itself, not scrollY vs page
      // height, which browser zoom and fractional pixels throw off.
      const lastHref = HOME_ANCHORS[HOME_ANCHORS.length - 1].href;
      const lastSection = document.querySelector(lastHref);
      if (current && lastSection && lastSection.getBoundingClientRect().bottom <= window.innerHeight + 8) {
        current = lastHref;
      }
      setActiveAnchor(current);
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
    // The page behind the open menu stays put (the menu only exists on mobile).
    const root = document.documentElement;
    root.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      root.style.overflow = '';
    };
  }, [mobileNavOpen]);

  return (
    <header
      className={`obw-nav site-header${isHome ? ' site-header--overlay' : ''}${isVisible ? ' site-header--visible' : ''}`}>
      <div className="obw-nav__inner site-header__inner">
        <div className="site-header__start">
          {/* Theme page: a back control in the bar, like the login header's. */}
          {location.pathname === '/tema' ? <ScreenBackButton fallback="/" /> : null}
          <Link className="obw-nav__brand site-header__brand" to="/">
            <span className="obw-nav__brand-title">{WEDDING_OPERATION_NAME}</span>
            <span className="obw-nav__brand-sub">{WEDDING_COUPLE_NAMES}</span>
          </Link>
        </div>

        <div className="site-header__end">
          <nav
            className={`${desktopNavClassName} site-header__nav site-header__nav--desktop`}
            aria-label={t('navigation.menu.primary')}>
            {navItems.map((item) => (
              <NavItemLink
                key={item.key}
                item={item}
                className={desktopLinkClassName}
                activeClassName="is-active"
                isActive={item.key === activeAnchor}
                onNavigate={closeMobileNav}
              />
            ))}
            {showSignOutPill ? (
              <button type="button" className={desktopLinkClassName} onClick={() => void handleSignOut()}>
                <LogOut size={16} aria-hidden />
                <span>{t('common.signOut')}</span>
              </button>
            ) : null}
          </nav>

          {showSignOutPill ? (
            <img src="/assets/wedding/stemma.webp" alt="" className="site-header__crest site-header__crest--desktop" />
          ) : (
            <AppUserMenu />
          )}

          {/* Phones: a tag naming the current section (styled like the desktop pills, not clickable)
              and the crest, which opens the menu. */}
          <span className="site-header__section-tag">
            <currentSection.icon size={16} aria-hidden />
            {currentSection.label}
          </span>
          <button
            type="button"
            className={`site-header__crest-btn${mobileNavOpen ? ' is-open' : ''}`}
            aria-expanded={mobileNavOpen}
            aria-controls="site-header-mobile-panel"
            aria-label={mobileNavOpen ? t('navigation.menu.close') : t('navigation.menu.open')}
            onClick={() => setMobileNavOpen((current) => !current)}>
            <img src="/assets/wedding/stemma.webp" alt="" className="site-header__crest" />
          </button>
        </div>
      </div>

      {/* Blurs the page behind the open menu; a tap on it closes the menu. In
          body, not here: the header's backdrop-filter would trap a fixed child. */}
      {mobileNavOpen
        ? createPortal(<div className="site-header__scrim" aria-hidden onClick={closeMobileNav} />, document.body)
        : null}
      {mobileNavOpen ? (
        <div
          id="site-header-mobile-panel"
          className="site-header__mobile-panel obw-fade-up"
          aria-label={t('navigation.menu.primary')}>
          {navItems.map((item) => (
            <NavItemLink
              key={item.key}
              item={item}
              className="site-header__mobile-link site-header__mobile-link--icon"
              activeClassName="is-active"
              isActive={item.key === activeAnchor}
              onNavigate={closeMobileNav}
            />
          ))}
          <AppUserMenuContent onNavigate={closeMobileNav} />
        </div>
      ) : null}
    </header>
  );
}
