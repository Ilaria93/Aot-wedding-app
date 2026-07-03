import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { PageHero } from '@/components/PageShell';
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

  if (isBootstrapping || loading) {
    return (
      <div className="loading-screen">
        <span className="loading-text">{t('common.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="obw-page obw-page--app">
        <div className="obw-container obw-page__stack">
          <div className="alert-card" role="alert">
            <p className="error-text error-text--flush">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="obw-page obw-page--app">
      <div className="obw-container obw-page__stack">
        <PageHero
          eyebrow={t('admin.hero.eyebrow')}
          title={t('admin.hero.title')}
          subtitle={t('admin.hero.subtitle')}
          subtitleFlush
        />

        {stats ? (
          <div className="dev-grid dev-grid--spaced">
            <div className="dev-card">
              <p className="obw-kicker">{t('admin.stats.users')}</p>
              <p className="title">{stats.total_users}</p>
            </div>
            <div className="dev-card">
              <p className="obw-kicker">{t('admin.stats.confirmed')}</p>
              <p className="title">{stats.total_confirmed}</p>
            </div>
            <div className="dev-card">
              <p className="obw-kicker">{t('admin.stats.attending')}</p>
              <p className="title">{stats.total_attending}</p>
            </div>
          </div>
        ) : null}

        <section className="obw-card landing-section">
          <h2 className="obw-display obw-display--sm">{t('admin.users.title')}</h2>
          <div className="admin-guest-list">
            {users.map((user) => (
              <article key={user.id} className="dev-card">
                <strong>{formatUserName(user)}</strong>
                <p className="helper-text helper-text--flush">{user.email}</p>
                <p className="helper-text">
                  {user.has_rsvp
                    ? t('admin.rsvpStatuses.attending')
                    : t('admin.rsvpStatuses.pending')}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
