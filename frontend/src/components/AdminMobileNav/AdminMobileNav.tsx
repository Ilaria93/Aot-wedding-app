import { Contact, Home, Image as ImageIcon, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import './styles/AdminMobileNav.scss';

const TABS = [
  { to: '/admin/rsvp', icon: Home, labelKey: 'admin.nav.rsvp' as const },
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
