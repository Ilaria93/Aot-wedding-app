import { Camera, Home, Map, Shield, User } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';

/** App shell with responsive bottom/top navigation for authenticated areas. */
export function AppLayout() {
  const { canManageWedding } = useAuth();
  const { t } = useI18n();

  const navItems = [
    { to: '/', label: t('navigation.tabs.invitation'), icon: Home, end: true },
    ...(canManageWedding
      ? [{ to: '/admin', label: t('navigation.tabs.admin'), icon: Shield, end: false }]
      : []),
    { to: '/album', label: t('navigation.tabs.album'), icon: Camera, end: false },
    { to: '/travel', label: t('navigation.tabs.travel'), icon: Map, end: false },
    { to: '/profile', label: t('navigation.tabs.profile'), icon: User, end: false },
  ] as const;

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '12px 20px',
          background: 'rgba(223, 232, 218, 0.9)',
          backdropFilter: 'blur(8px)',
        }}>
        <LanguageSwitcher compact />
      </header>
      <main>
        <Outlet />
      </main>
      <nav
        className="app-nav"
        style={{ gridTemplateColumns: `repeat(${navItems.length}, 1fr)` }}
        aria-label={t('navigation.tabs.invitation')}>
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
