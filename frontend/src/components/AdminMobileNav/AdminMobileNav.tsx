import { Contact, Home, Image as ImageIcon, LayoutDashboard, LogOut, Send } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import './styles/AdminMobileNav.scss';

const TABS = [
  // Home is the guest site, so the couple can see it without logging out.
  { to: '/', icon: Home, labelKey: 'navigation.tabs.home' as const },
  { to: '/admin/rsvp', icon: LayoutDashboard, labelKey: 'admin.nav.rsvp' as const },
  { to: '/admin/invites', icon: Send, labelKey: 'admin.nav.invites' as const },
  { to: '/admin/contacts', icon: Contact, labelKey: 'admin.nav.contacts' as const },
  { to: '/admin/gallery', icon: ImageIcon, labelKey: 'admin.nav.gallery' as const },
] as const;

/** Bottom tab bar shown only on small screens within the admin section. */
export function AdminMobileNav() {
  const { t } = useI18n();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <nav className="admin-mobile-nav" aria-label={t('navigation.menu.primary')}>
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) => `admin-mobile-nav__item${isActive ? ' is-active' : ''}`}>
          <tab.icon size={18} aria-hidden />
          <span>{t(tab.labelKey)}</span>
        </NavLink>
      ))}
      <button type="button" className="admin-mobile-nav__item" onClick={() => void handleSignOut()}>
        <LogOut size={18} aria-hidden />
        <span>{t('common.signOut')}</span>
      </button>
    </nav>
  );
}
