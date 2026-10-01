import { useState } from 'react';

import { Lightbox } from '@/components/Lightbox';
import { isVideoMimeType, type PublicPhotoAlbumItem } from '@/services/photoAlbumApi';
import { useI18n } from '@/contexts/I18nContext';
import { formatDateByLocale } from '@/types/formatters';

type AlbumGridProps = {
  photos: PublicPhotoAlbumItem[];
};

/** Grid of public wedding photos, opening a swipeable lightbox on click. */
export function AlbumGrid({ photos }: AlbumGridProps) {
  const { locale, t } = useI18n();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const lightboxItems = photos.map((photo) => ({
    src: photo.image_url,
    alt: photo.caption || photo.uploader_name,
    caption: photo.caption ? `${photo.uploader_name} — "${photo.caption}"` : photo.uploader_name,
    isVideo: isVideoMimeType(photo.mime_type),
  }));

  return (
    <div className="obw-card">
      <h2 className="obw-display obw-display--sm">{t('album.galleryTitle')}</h2>
      {photos.length === 0 ? (
        <p className="obw-body obw-body--flush">{t('album.galleryEmpty')}</p>
      ) : (
        photos.map((photo, index) => (
          <article key={photo.id} className="photo-card">
            {isVideoMimeType(photo.mime_type) ? (
              <video className="photo-card__image" src={photo.image_url} controls />
            ) : (
              <img
                className="photo-card__image"
                src={photo.image_url}
                alt={photo.caption || photo.uploader_name}
                style={{ cursor: 'pointer' }}
                onClick={() => setOpenIndex(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') setOpenIndex(index);
                }}
              />
            )}
            <p className="photo-card__guest">{photo.uploader_name}</p>
            <p className="photo-card__meta">{formatDateByLocale(photo.uploaded_at, locale)}</p>
            {photo.caption ? <p className="photo-card__caption">{photo.caption}</p> : null}
          </article>
        ))
      )}

      <Lightbox items={lightboxItems} openIndex={openIndex} onChange={setOpenIndex} />
    </div>
  );
}
