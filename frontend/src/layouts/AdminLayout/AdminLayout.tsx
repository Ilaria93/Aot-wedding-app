import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { AdminMobileNav } from '@/components/AdminMobileNav';
import { PageAlert, PageShell } from '@/components/PageShell';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { AdminHeroStatsSlotContext } from './AdminHeroStatsSlotContext';
import { useAdminHeroContent } from './useAdminHeroContent';
import './styles/AdminLayout.scss';

/** Shared shell for every admin section — access gate and hero (plain,
 * left-aligned, no card/background — see useAdminHeroContent for per-route
 * copy), plus a bottom tab bar on small screens (see AdminMobileNav). */
export function AdminLayout() {
  const { canManageWedding, isAuthenticated, isBootstrapping } = useAuth();
  const { t } = useI18n();
  const hero = useAdminHeroContent();
  const [heroStatsSlot, setHeroStatsSlot] = useState<HTMLDivElement | null>(null);

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
    <>
      {/* AdminMobileNav must render outside PageShell: .obw-page has a
          backdrop-filter, which creates a new containing block for
          position:fixed descendants — nested inside it, "fixed to the
          bottom" would mean the bottom of that div, not the viewport. */}
      <PageShell>
        <div className="admin-layout__content">
          <div className="admin-layout__hero-row">
            <div className="admin-layout__hero">
              <div className="admin-layout__hero-meta">
                <span className="obw-portal-kicker admin-layout__hero-eyebrow">
                  {hero.eyebrowSegments.map((segment, index) => (
                    <span key={segment}>
                      {index > 0 ? (
                        <span className="admin-layout__hero-eyebrow-sep" aria-hidden="true">
                          •
                        </span>
                      ) : null}
                      {segment}
                    </span>
                  ))}
                </span>
                {hero.code ? <span className="admin-layout__hero-code">{hero.code}</span> : null}
              </div>
              <p className="obw-portal-title">
                {hero.titleLead}
                {hero.titleHighlight ? (
                  <>
                    {' '}
                    <span className="admin-layout__hero-title-highlight">{hero.titleHighlight}</span>
                  </>
                ) : null}
              </p>
              <p className="obw-portal-subtitle">{hero.subtitle}</p>
            </div>
            <div className="admin-layout__hero-stats-slot" ref={setHeroStatsSlot} />
          </div>

          <AdminHeroStatsSlotContext.Provider value={heroStatsSlot}>
            <Outlet />
          </AdminHeroStatsSlotContext.Provider>
        </div>
      </PageShell>

      <AdminMobileNav />
    </>
  );
}
