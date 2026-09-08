import { NavLink, Outlet } from 'react-router-dom';

import { PageAlert, PageHero, PageShell } from '@/components/PageShell';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import './styles/AdminLayout.scss';

const ADMIN_TABS = [
  { to: '/admin/rsvp', labelKey: 'rsvp' as const },
  { to: '/admin/contacts', labelKey: 'contacts' as const },
  { to: '/admin/gallery', labelKey: 'gallery' as const },
] as const;

/** Shared shell for every admin section — access gate, hero and section tabs. */
export function AdminLayout() {
  const { canManageWedding, isAuthenticated, isBootstrapping } = useAuth();
  const { t } = useI18n();

  if (isBootstrapping) {
    return <PageShell loading>{null}</PageShell>;
  }

  if (!isAuthenticated) {
    return (
      <PageShell>
        <PageAlert message={t('admin.errors.loginRequired')} />
      </PageShell>
    );
  }

  if (!canManageWedding) {
    return (
      <PageShell>
        <PageAlert message={t('admin.errors.notAuthorized')} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHero eyebrow={t('admin.hero.eyebrow')} title={t('admin.hero.title')} subtitle={t('admin.hero.subtitle')} subtitleFlush>
        <nav className="admin-layout__tabs" aria-label={t('admin.nav.label')}>
          {ADMIN_TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) => `admin-layout__tab${isActive ? ' is-active' : ''}`}>
              {t(`admin.nav.${tab.labelKey}`)}
            </NavLink>
          ))}
        </nav>
      </PageHero>

      <Outlet />
    </PageShell>
  );
}
