import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { PageAlert, PageHero, PageShell } from '@/components/PageShell';
import {
  type AdminUserListItem,
  type AdminRsvpStats,
  fetchAdminUserList,
  fetchAdminRsvpStats,
} from '@/services/adminDashboardApi';
import { getApiErrorMessage } from '@/services/apiErrors';
import './styles/AdminPage.scss';

function formatUserName(user: AdminUserListItem): string {
  return `${user.first_name} ${user.last_name}`.trim();
}

/** Admin dashboard — RSVP stats and user list. */
export function AdminPage() {
  const { canManageWedding, isAuthenticated, isBootstrapping } = useAuth();
  const { t } = useI18n();
  const [stats, setStats] = useState<AdminRsvpStats | null>(null);
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAdminDashboard = useCallback(async () => {
    if (!isAuthenticated) {
      setError(t('admin.errors.loginRequired'));
      setLoading(false);
      return;
    }
    if (!canManageWedding) {
      setError(t('admin.errors.notAuthorized'));
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const [statsResponse, userListResponse] = await Promise.all([
        fetchAdminRsvpStats(),
        fetchAdminUserList(),
      ]);
      setStats(statsResponse);
      setUsers(userListResponse);
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, t('admin.errors.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [canManageWedding, isAuthenticated, t]);

  useEffect(() => {
    if (!isBootstrapping) {
      void loadAdminDashboard();
    }
  }, [isBootstrapping, loadAdminDashboard]);

  return (
    <PageShell loading={isBootstrapping || loading}>
      {error ? (
        <PageAlert message={error} />
      ) : (
        <>
          <PageHero
            eyebrow={t('admin.hero.eyebrow')}
            title={t('admin.hero.title')}
            subtitle={t('admin.hero.subtitle')}
            subtitleFlush
          />

          {stats ? (
            <div className="obw-stat-grid">
              <div className="obw-stat-card">
                <p className="obw-kicker">{t('admin.stats.users')}</p>
                <p className="obw-stat-card__value">{stats.total_users}</p>
              </div>
              <div className="obw-stat-card">
                <p className="obw-kicker">{t('admin.stats.confirmed')}</p>
                <p className="obw-stat-card__value">{stats.total_confirmed}</p>
              </div>
              <div className="obw-stat-card">
                <p className="obw-kicker">{t('admin.stats.attending')}</p>
                <p className="obw-stat-card__value">{stats.total_attending}</p>
              </div>
            </div>
          ) : null}

          <section className="obw-card">
            <h2 className="obw-display obw-display--sm">{t('admin.users.title')}</h2>
            <div className="obw-data-list">
              {users.map((user) => (
                <article key={user.id} className="obw-data-row">
                  <span className="obw-data-row__title">{formatUserName(user)}</span>
                  <p className="obw-data-row__meta obw-data-row__meta--flush">{user.email}</p>
                  <span
                    className={`obw-status-pill ${
                      user.has_rsvp ? 'obw-status-pill--active' : 'obw-status-pill--pending'
                    }`}>
                    {user.has_rsvp
                      ? t('admin.rsvpStatuses.attending')
                      : t('admin.rsvpStatuses.pending')}
                  </span>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </PageShell>
  );
}
