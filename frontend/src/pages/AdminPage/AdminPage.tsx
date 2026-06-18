import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
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
    return <div className="loading-screen">…</div>;
  }

  if (error) {
    return (
      <div className="page-shell">
        <p className="error-text">{error}</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="card admin-hero-card">
        <p className="eyebrow">{t('admin.hero.eyebrow')}</p>
        <h1 className="title">{t('admin.hero.title')}</h1>
        <p className="subtitle">{t('admin.hero.subtitle')}</p>
      </div>

      {stats ? (
        <div className="dev-grid dev-grid--spaced">
          <div className="dev-card">
            <p className="eyebrow">{t('admin.stats.users')}</p>
            <p className="title">{stats.total_users}</p>
          </div>
          <div className="dev-card">
            <p className="eyebrow">{t('admin.stats.confirmed')}</p>
            <p className="title">{stats.total_confirmed}</p>
          </div>
          <div className="dev-card">
            <p className="eyebrow">{t('admin.stats.attending')}</p>
            <p className="title">{stats.total_attending}</p>
          </div>
        </div>
      ) : null}

      <section className="landing-section">
        <h2 className="section-heading">{t('admin.users.title')}</h2>
        <div className="admin-guest-list">
          {users.map((user) => (
            <article key={user.id} className="dev-card">
              <strong>{formatUserName(user)}</strong>
              <p className="helper-text">{user.email}</p>
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
  );
}
