import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';

import { useI18n } from '@/contexts/I18nContext';
import './styles/Lightbox.scss';

export type LightboxItem = {
  src: string;
  alt: string;
  caption?: string;
  isVideo?: boolean;
};

type LightboxProps = {
  items: LightboxItem[];
  /** Index of the open item, or null when closed. */
  openIndex: number | null;
  onChange: (index: number | null) => void;
};

const SWIPE_THRESHOLD_PX = 50;
const DOUBLE_TAP_MS = 300;
const ZOOM_FACTOR = 2.5;

type Zoom = {
  /** Rendered width of the zoomed photo, in px. */
  width: number;
  /** Where the double tap landed, as a fraction of the fitted photo. */
  originX: number;
  originY: number;
  /** The same point, relative to the stage's top-left corner. */
  stageX: number;
  stageY: number;
};

/**
 * Full-screen photo viewer: arrows, swipe, Esc to close. A double tap (or
 * double click) zooms in around that point and the photo then pans by
 * scrolling/dragging; phones can also pinch-zoom natively.
 */
export function Lightbox({ items, openIndex, onChange }: LightboxProps) {
  const { t } = useI18n();
  const touchStartX = useRef<number | null>(null);
  const lastTap = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<Zoom | null>(null);
  const count = items.length;

  const showPrev = () => onChange(openIndex === null ? null : (openIndex - 1 + count) % count);
  const showNext = () => onChange(openIndex === null ? null : (openIndex + 1) % count);

  // Every photo opens fitted to the screen.
  useEffect(() => setZoom(null), [openIndex]);

  // The page behind stays put while the viewer is open.
  const isOpen = openIndex !== null;
  useEffect(() => {
    if (!isOpen) return undefined;
    const root = document.documentElement;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (openIndex === null) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onChange(null);
      if (event.key === 'ArrowLeft') showPrev();
      if (event.key === 'ArrowRight') showNext();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Keep the tapped point under the finger once the photo has grown.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!zoom || !stage) return;
    const height = stage.querySelector('img')?.offsetHeight ?? 0;
    stage.scrollLeft = zoom.originX * zoom.width - zoom.stageX;
    stage.scrollTop = zoom.originY * height - zoom.stageY;
  }, [zoom]);

  function handlePhotoClick(event: MouseEvent<HTMLImageElement>) {
    event.stopPropagation();
    const photo = event.currentTarget;
    const box = photo.getBoundingClientRect();
    // The <img> fills the stage (object-fit: contain): find the visible photo inside it.
    const fit = zoom ? 1 : Math.min(box.width / photo.naturalWidth, box.height / photo.naturalHeight);
    const shown = {
      width: zoom ? box.width : photo.naturalWidth * fit,
      height: zoom ? box.height : photo.naturalHeight * fit,
    };
    const left = box.left + (box.width - shown.width) / 2;
    const top = box.top + (box.height - shown.height) / 2;
    const outside =
      event.clientX < left || event.clientX > left + shown.width || event.clientY < top || event.clientY > top + shown.height;
    if (outside) {
      onChange(null);
      return;
    }

    const now = Date.now();
    const isDoubleTap = now - lastTap.current < DOUBLE_TAP_MS;
    lastTap.current = isDoubleTap ? 0 : now;
    if (!isDoubleTap) return;

    if (zoom) {
      setZoom(null);
      return;
    }
    const stage = stageRef.current!.getBoundingClientRect();
    setZoom({
      width: shown.width * ZOOM_FACTOR,
      originX: (event.clientX - left) / shown.width,
      originY: (event.clientY - top) / shown.height,
      stageX: event.clientX - stage.left,
      stageY: event.clientY - stage.top,
    });
  }

  const item = openIndex !== null ? items[openIndex] : null;
  if (!item) return null;

  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      onClick={() => onChange(null)}
      onTouchStart={(event) => {
        // Two fingers = pinch-zoom, not a swipe.
        touchStartX.current = event.touches.length === 1 ? event.touches[0].clientX : null;
      }}
      onTouchEnd={(event) => {
        if (touchStartX.current === null) return;
        const deltaX = event.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        // While zoomed (ours or the browser's pinch) a drag pans the photo.
        if (zoom || (window.visualViewport?.scale ?? 1) > 1.01) return;
        if (deltaX > SWIPE_THRESHOLD_PX) showPrev();
        else if (deltaX < -SWIPE_THRESHOLD_PX) showNext();
      }}>
      <div ref={stageRef} className={`lightbox__stage${zoom ? ' is-zoomed' : ''}`}>
        {item.isVideo ? (
          <video
            className="lightbox__media"
            src={item.src}
            controls
            autoPlay
            onClick={(event) => event.stopPropagation()}
          />
        ) : (
          <img
            className="lightbox__media"
            src={item.src}
            alt={item.alt}
            style={zoom ? { width: zoom.width } : undefined}
            onClick={handlePhotoClick}
          />
        )}
      </div>

      <button type="button" className="lightbox__close" aria-label={t('common.cancel')} onClick={() => onChange(null)}>
        <X size={18} aria-hidden />
      </button>

      {count > 1 ? (
        <>
          <button
            type="button"
            className="lightbox__nav lightbox__nav--prev"
            aria-label={t('album.previousMedia')}
            onClick={(event) => {
              event.stopPropagation();
              showPrev();
            }}>
            <ChevronLeft size={22} aria-hidden />
          </button>
          <button
            type="button"
            className="lightbox__nav lightbox__nav--next"
            aria-label={t('album.nextMedia')}
            onClick={(event) => {
              event.stopPropagation();
              showNext();
            }}>
            <ChevronRight size={22} aria-hidden />
          </button>
        </>
      ) : null}

      {item.caption && !zoom ? <p className="lightbox__caption">{item.caption}</p> : null}
    </div>,
    document.body,
  );
}
