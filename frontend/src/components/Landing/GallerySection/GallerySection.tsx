import { ImageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useI18n } from '@/contexts/I18nContext';
import { fetchPublicPhotoAlbum, isVideoMimeType, type PublicPhotoAlbumItem } from '@/services/photoAlbumApi';
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

/** Six tiles: photos first, then dashed upload slots. One slot always stays
 *  free so the upload path to the album is never hidden. */
const TILE_COUNT = 6;
const MAX_PHOTOS = TILE_COUNT - 1;

/** Shapes cycle across the four-column row: circle, blob, rounded square, circle. */
const TILE_SHAPES = ['circle', 'blob', 'square', 'circle'] as const;

function tileShapeClass(index: number) {
  return `landing-gallery__tile landing-gallery__tile--${TILE_SHAPES[index % TILE_SHAPES.length]}`;
}

/** Landing gallery preview: recent shared photos plus upload slots linking to the album. */
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
        <header className="landing-gallery__head">
          <h2 className="obw-display obw-display--lg">{t('landing.gallery.title')}</h2>
          <span className="obw-rule obw-rule--center" aria-hidden="true" />
        </header>

        {view.status === 'loading' ? (
          <p className="obw-body obw-body--flush landing-gallery__status">{t('landing.gallery.loading')}</p>
        ) : null}

        {view.status === 'error' ? (
          <div className="landing-gallery__status">
            <p className="obw-body obw-body--flush">{t('landing.gallery.error')}</p>
            <button
              type="button"
              className="obw-btn obw-btn--secondary"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              {t('landing.gallery.retry')}
            </button>
          </div>
        ) : null}

        {view.status === 'empty' || view.status === 'ready' ? (
          <GalleryTiles photos={view.status === 'ready' ? view.photos.slice(0, MAX_PHOTOS) : []} />
        ) : null}
      </div>
    </section>
  );
}

function GalleryTiles({ photos }: { photos: PublicPhotoAlbumItem[] }) {
  const { t } = useI18n();
  const slotCount = TILE_COUNT - photos.length;

  return (
    <div className="landing-gallery__grid">
      {photos.map((photo, index) =>
        isVideoMimeType(photo.mime_type) ? (
          <video key={photo.id} className={tileShapeClass(index)} src={photo.image_url} muted />
        ) : (
          <img
            key={photo.id}
            className={tileShapeClass(index)}
            src={photo.image_url}
            alt={photo.caption || photo.uploader_name}
            loading="lazy"
          />
        ),
      )}
      {Array.from({ length: slotCount }, (_, slot) => (
        <Link
          key={`slot-${slot}`}
          to="/album"
          className={`${tileShapeClass(photos.length + slot)} landing-gallery__slot`}
        >
          <ImageIcon size={34} strokeWidth={1.25} aria-hidden />
          <span className="landing-gallery__slot-title">{t('landing.gallery.slotTitle')}</span>
          <span className="landing-gallery__slot-action">{t('landing.gallery.slotAction')}</span>
        </Link>
      ))}
    </div>
  );
}
