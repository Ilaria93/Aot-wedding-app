import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { isVideoMimeType, type PublicPhotoAlbumItem } from '@/services/photoAlbumApi';
import { useI18n } from '@/contexts/I18nContext';
import { formatDateByLocale } from '@/types/formatters';

type AlbumGridProps = {
  photos: PublicPhotoAlbumItem[];
};

const SWIPE_THRESHOLD_PX = 50;

/** Grid of public wedding photos, opening a swipeable lightbox on click. */
export function AlbumGrid({ photos }: AlbumGridProps) {
  const { locale, t } = useI18n();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const showPrev = () => setOpenIndex((current) => (current === null ? null : (current - 1 + photos.length) % photos.length));
  const showNext = () => setOpenIndex((current) => (current === null ? null : (current + 1) % photos.length));

  useEffect(() => {
    if (openIndex === null) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenIndex(null);
      if (event.key === 'ArrowLeft') showPrev();
      if (event.key === 'ArrowRight') showNext();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openIndex, photos.length]);

  const openPhoto = openIndex !== null ? photos[openIndex] : null;

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

      {openPhoto
        ? createPortal(
            <div className="album-lightbox-backdrop" onClick={() => setOpenIndex(null)}>
              <div
                className="album-lightbox"
                onClick={(event) => event.stopPropagation()}
                onTouchStart={(event) => {
                  touchStartX.current = event.touches[0].clientX;
                }}
                onTouchEnd={(event) => {
                  if (touchStartX.current === null) return;
                  const deltaX = event.changedTouches[0].clientX - touchStartX.current;
                  touchStartX.current = null;
                  if (deltaX > SWIPE_THRESHOLD_PX) showPrev();
                  else if (deltaX < -SWIPE_THRESHOLD_PX) showNext();
                }}>
                <button
                  type="button"
                  className="album-lightbox__close"
                  aria-label={t('common.cancel')}
                  onClick={() => setOpenIndex(null)}>
                  <X size={18} aria-hidden />
                </button>

                {photos.length > 1 ? (
                  <button
                    type="button"
                    className="album-lightbox__nav album-lightbox__nav--prev"
                    aria-label={t('album.previousMedia')}
                    onClick={showPrev}>
                    <ChevronLeft size={22} aria-hidden />
                  </button>
                ) : null}

                {isVideoMimeType(openPhoto.mime_type) ? (
                  <video className="album-lightbox__media" src={openPhoto.image_url} controls autoPlay />
                ) : (
                  <img
                    className="album-lightbox__media"
                    src={openPhoto.image_url}
                    alt={openPhoto.caption || openPhoto.uploader_name}
                  />
                )}

                {photos.length > 1 ? (
                  <button
                    type="button"
                    className="album-lightbox__nav album-lightbox__nav--next"
                    aria-label={t('album.nextMedia')}
                    onClick={showNext}>
                    <ChevronRight size={22} aria-hidden />
                  </button>
                ) : null}

                <p className="album-lightbox__caption">
                  {openPhoto.uploader_name}
                  {openPhoto.caption ? ` — "${openPhoto.caption}"` : ''}
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
