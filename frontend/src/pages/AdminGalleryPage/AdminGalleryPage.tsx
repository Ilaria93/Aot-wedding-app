import { useCallback, useEffect, useState } from 'react';

import { AlbumUploadPanel } from '@/components/Album/AlbumUploadPanel';
import { PageAlert } from '@/components/PageShell';
import { useI18n } from '@/contexts/I18nContext';
import { getApiErrorMessage } from '@/services/apiErrors';
import {
  deleteAdminPhoto,
  fetchPublicPhotoAlbum,
  type PublicPhotoAlbumItem,
} from '@/services/photoAlbumApi';
import { formatDateByLocale } from '@/types/formatters';
import './styles/AdminGalleryPage.scss';

/** Admin section — every uploaded photo, with the option to remove one. */
export function AdminGalleryPage() {
  const { locale, t } = useI18n();
  const [photos, setPhotos] = useState<PublicPhotoAlbumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadPhotos = useCallback(async () => {
    try {
      setError(null);
      setPhotos(await fetchPublicPhotoAlbum());
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, t('admin.photos.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadPhotos();
  }, [loadPhotos]);

  async function handleDelete(photo: PublicPhotoAlbumItem) {
    if (!window.confirm(t('admin.photos.confirmDelete'))) {
      return;
    }

    try {
      setDeletingId(photo.id);
      await deleteAdminPhoto(photo.id);
      setPhotos((current) => current.filter((item) => item.id !== photo.id));
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, t('admin.errors.photoDeleteFailed')));
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="loading-text">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <>
      <AlbumUploadPanel onUploadSuccess={loadPhotos} />

      <section className="obw-portal-card">
        <h2 className="obw-display obw-display--sm">{t('admin.photos.title')}</h2>

        {error ? <PageAlert message={error} /> : null}

        {photos.length === 0 ? (
          <p className="obw-body obw-body--flush">{t('admin.photos.empty')}</p>
        ) : (
          <div className="admin-gallery__grid">
            {photos.map((photo) => (
              <article key={photo.id} className="admin-gallery__card">
                <img
                  className="admin-gallery__image"
                  src={photo.image_url}
                  alt={photo.caption || photo.uploader_name}
                />
                <p className="admin-gallery__guest">{photo.uploader_name}</p>
                <p className="admin-gallery__meta">
                  {t('admin.photos.uploadedAt', { value: formatDateByLocale(photo.uploaded_at, locale) ?? '' })}
                </p>
                {photo.caption ? <p className="admin-gallery__caption">{photo.caption}</p> : null}
                <button
                  type="button"
                  className="obw-portal-btn obw-portal-btn--secondary obw-portal-btn--block"
                  disabled={deletingId === photo.id}
                  onClick={() => void handleDelete(photo)}>
                  {deletingId === photo.id ? t('admin.photos.deleting') : t('admin.photos.delete')}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
