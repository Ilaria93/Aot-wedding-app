import { useCallback, useEffect, useState } from 'react';

import { useI18n } from '@/contexts/I18nContext';
import { PageAlert } from '@/components/PageShell';
import {
  type AdminUserListItem,
  type AdminRsvpStats,
  fetchAdminUserList,
  fetchAdminRsvpStats,
} from '@/services/adminDashboardApi';
import { getApiErrorMessage } from '@/services/apiErrors';
import './styles/AdminRsvpPage.scss';

function formatUserName(user: AdminUserListItem): string {
  return `${user.first_name} ${user.last_name}`.trim();
}

/** Admin section — RSVP stats and the list of who has responded. */
export function AdminRsvpPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<AdminRsvpStats | null>(null);
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAdminDashboard = useCallback(async () => {
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
  }, [t]);

  useEffect(() => {
    void loadAdminDashboard();
  }, [loadAdminDashboard]);

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="loading-text">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <>
      {error ? (
        <PageAlert message={error} />
      ) : (
        <>
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
    </>
  );
}
