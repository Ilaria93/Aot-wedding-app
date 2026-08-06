import { useCallback, useEffect, useState } from 'react';

import { PageAlert, PageHero, PageShell } from '@/components/PageShell';
import { useI18n } from '@/contexts/I18nContext';
import { AlbumGrid } from '@/components/Album/AlbumGrid';
import { AlbumUploadPanel } from '@/components/Album/AlbumUploadPanel';
import {
  fetchPublicPhotoAlbum,
  type PublicPhotoAlbumItem,
} from '@/services/photoAlbumApi';
import './styles/AlbumPage.scss';

/** Guest-facing wedding album with browser file upload. */
export function AlbumPage() {
  const { t } = useI18n();
  const [photos, setPhotos] = useState<PublicPhotoAlbumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAlbum = useCallback(async () => {
    try {
      setError(null);
      const publicPhotos = await fetchPublicPhotoAlbum();
      setPhotos(publicPhotos);
    } catch {
      setError(t('album.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    void loadAlbum();
  }, [loadAlbum]);

  return (
    <PageShell loading={loading}>
      <PageHero eyebrow={t('album.eyebrow')} title={t('album.title')} subtitle={t('album.subtitle')}>
        <button
          type="button"
          className="obw-btn obw-btn--secondary"
          disabled={refreshing}
          onClick={() => {
            setRefreshing(true);
            void loadAlbum();
          }}>
          {refreshing ? t('album.refreshLoading') : t('album.refreshButton')}
        </button>
      </PageHero>

      {error ? <PageAlert message={error} /> : null}

      <AlbumUploadPanel onUploadSuccess={loadAlbum} />
      <AlbumGrid photos={photos} />
    </PageShell>
  );
}
