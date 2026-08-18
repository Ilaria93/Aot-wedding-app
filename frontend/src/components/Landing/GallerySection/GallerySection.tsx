import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useI18n } from '@/contexts/I18nContext';
import { fetchPublicPhotoAlbum, type PublicPhotoAlbumItem } from '@/services/photoAlbumApi';
import './styles/GallerySection.scss';

export type GalleryViewState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'empty' }
  | { status: 'ready'; photos: PublicPhotoAlbumItem[] };

// Pure derivation of the section view state from the fetch result, so the
// loading / empty / error / ready branches are unit-testable.
export function toGalleryViewState(
  isLoading: boolean,
  hasError: boolean,
  photos: PublicPhotoAlbumItem[],
): GalleryViewState {
  if (isLoading) {
    return { status: 'loading' };
  }
  if (hasError) {
    return { status: 'error' };
  }
  if (photos.length === 0) {
    return { status: 'empty' };
  }
  return { status: 'ready', photos };
}

/** Landing gallery preview: recent shared photos plus a CTA to the full album. */
export function GallerySection() {
  const { t } = useI18n();
  const [photos, setPhotos] = useState<PublicPhotoAlbumItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setHasError(false);

    fetchPublicPhotoAlbum()
      .then((items) => {
        if (active) {
          setPhotos(items);
        }
      })
      .catch(() => {
        if (active) {
          setHasError(true);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const view = toGalleryViewState(isLoading, hasError, photos);

  return (
    <section className="obw-section obw-fade-up landing-gallery" id="gallery">
      <div className="obw-container">
        <div className="obw-section-header">
          <p className="obw-kicker">{t('landing.gallery.eyebrow')}</p>
          <h2 className="obw-display obw-display--lg">{t('landing.gallery.title')}</h2>
          <div className="obw-rule" aria-hidden="true" />
          <p className="obw-body obw-section-header__intro">{t('landing.gallery.intro')}</p>
        </div>

        <div className="landing-gallery__content">
          {view.status === 'loading' ? (
            <p className="obw-body obw-body--flush">{t('landing.gallery.loading')}</p>
          ) : null}

          {view.status === 'error' ? (
            <div className="landing-gallery__status">
              <p className="obw-body obw-body--flush">{t('landing.gallery.error')}</p>
              <button
                type="button"
                className="obw-btn obw-btn--secondary landing-gallery__retry"
                onClick={() => setReloadKey((key) => key + 1)}
              >
                {t('landing.gallery.retry')}
              </button>
            </div>
          ) : null}

          {view.status === 'empty' ? (
            <p className="obw-body obw-body--flush">{t('landing.gallery.empty')}</p>
          ) : null}

          {view.status === 'ready' ? (
            <div className="landing-gallery__grid">
              {view.photos.map((photo) => (
                <img
                  key={photo.id}
                  className="landing-gallery__photo"
                  src={photo.image_url}
                  alt={photo.caption || photo.uploader_name}
                  loading="lazy"
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="landing-gallery__cta">
          <p className="obw-display obw-display--sm">{t('landing.gallery.ctaTitle')}</p>
          <p className="obw-body">{t('landing.gallery.ctaBody')}</p>
          <Link className="obw-btn" to="/album">
            {t('landing.gallery.ctaButton')}
          </Link>
        </div>
      </div>
    </section>
  );
}