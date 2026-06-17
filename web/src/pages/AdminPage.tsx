import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import {
  type AdminGuestListItem,
  type AdminRsvpStats,
  fetchAdminGuestList,
  fetchAdminRsvpStats,
} from '@/services/adminDashboardApi';
import {
  type AdminPhotoAlbumItem,
  fetchAdminPhotoAlbum,
  updateAdminPhotoStatus,
  type AdminPhotoStatus,
} from '@/services/photoAlbumApi';
import { getApiErrorMessage } from '@/utils/apiErrors';

/** Admin dashboard — RSVP stats, guest list and photo moderation (phase 1 web port). */
export function AdminPage() {
  const { canManageWedding, isAuthenticated, isBootstrapping } = useAuth();
  const { t } = useI18n();
  const [stats, setStats] = useState<AdminRsvpStats | null>(null);
  const [guests, setGuests] = useState<AdminGuestListItem[]>([]);
  const [photos, setPhotos] = useState<AdminPhotoAlbumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoActionId, setPhotoActionId] = useState<number | null>(null);

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
      const [statsResponse, guestListResponse, photoListResponse] = await Promise.all([
        fetchAdminRsvpStats(),
        fetchAdminGuestList(),
        fetchAdminPhotoAlbum(),
      ]);
      setStats(statsResponse);
      setGuests(guestListResponse);
      setPhotos(photoListResponse);
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

  async function handlePhotoStatusChange(photoId: number, status: AdminPhotoStatus) {
    try {
      setPhotoActionId(photoId);
      await updateAdminPhotoStatus(photoId, status);
      setPhotos((current) =>
        current.map((photo) => (photo.id === photoId ? { ...photo, status } : photo)),
      );
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, t('admin.errors.photoUpdateFailed')));
    } finally {
      setPhotoActionId(null);
    }
  }

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
      <div className="card" style={{ maxWidth: 'none', marginBottom: 20 }}>
        <p className="eyebrow">{t('admin.hero.eyebrow')}</p>
        <h1 className="title">{t('admin.hero.title')}</h1>
        <p className="subtitle">{t('admin.hero.subtitle')}</p>
      </div>

      {stats ? (
        <div className="dev-grid" style={{ marginBottom: 24 }}>
          <div className="dev-card">
            <p className="eyebrow">{t('admin.stats.invited')}</p>
            <p className="title">{stats.total_invited}</p>
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
        <h2 className="section-heading">{t('admin.guests.title')}</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {guests.map((guest) => (
            <article key={guest.id} className="dev-card">
              <strong>{guest.full_name}</strong>
              <p className="helper-text">
                {guest.has_rsvp
                  ? t('admin.rsvpStatuses.attending')
                  : t('admin.rsvpStatuses.pending')}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <h2 className="section-heading">{t('admin.photos.title')}</h2>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {photos.map((photo) => (
            <article key={photo.id} className="dev-card">
              <img
                src={photo.image_url}
                alt={photo.caption || photo.guest_full_name}
                style={{ width: '100%', borderRadius: 12, aspectRatio: '4 / 3', objectFit: 'cover' }}
              />
              <p className="helper-text">{photo.status}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(['approved', 'rejected', 'pending'] as AdminPhotoStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`button ${photo.status === status ? 'button-primary' : 'button-secondary'}`}
                    disabled={photoActionId === photo.id}
                    onClick={() => void handlePhotoStatusChange(photo.id, status)}>
                    {t(`admin.photoStatuses.${status}`)}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
