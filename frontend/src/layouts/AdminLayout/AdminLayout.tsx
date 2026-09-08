import { Outlet } from 'react-router-dom';

import { PageAlert, PageShell } from '@/components/PageShell';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';

/** Shared shell for every admin section — access gate and hero, styled as
 * the same "sealed portal" card as the login screen. Section navigation
 * lives in the top bar itself (see AppTopBar), not duplicated here. */
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
      <div className="obw-portal-card">
        <span className="obw-portal-kicker">{t('admin.hero.eyebrow')}</span>
        <p className="obw-portal-title">{t('admin.hero.title')}</p>
        <p className="obw-portal-subtitle">{t('admin.hero.subtitle')}</p>
      </div>

      <Outlet />
    </PageShell>
  );
}
