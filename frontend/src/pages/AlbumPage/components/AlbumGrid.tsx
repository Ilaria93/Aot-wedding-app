import type { PublicPhotoAlbumItem } from '@/services/photoAlbumApi';
import { useI18n } from '@/contexts/I18nContext';
import { formatDateByLocale } from '@/types/formatters';

type AlbumGridProps = {
  photos: PublicPhotoAlbumItem[];
};

/** Grid of approved public wedding photos. */
export function AlbumGrid({ photos }: AlbumGridProps) {
  const { locale, t } = useI18n();

  return (
    <div className="section-card">
      <h2 className="section-title">{t('album.approvedTitle')}</h2>
      {photos.length === 0 ? (
        <p className="empty-text">{t('album.approvedEmpty')}</p>
      ) : (
        photos.map((photo) => (
          <article key={photo.id} className="photo-card">
            <img
              className="photo-card__image"
              src={photo.image_url}
              alt={photo.caption || photo.uploader_name}
            />
            <p className="photo-card__guest">{photo.uploader_name}</p>
            <p className="photo-card__meta">{formatDateByLocale(photo.uploaded_at, locale)}</p>
            {photo.caption ? <p className="photo-card__caption">{photo.caption}</p> : null}
          </article>
        ))
      )}
    </div>
  );
}
