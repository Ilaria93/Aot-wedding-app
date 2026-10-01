import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
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

/** Full-screen viewer shown as a dark card: arrows, swipe, Esc to close. */
export function Lightbox({ items, openIndex, onChange }: LightboxProps) {
  const { t } = useI18n();
  const touchStartX = useRef<number | null>(null);
  const count = items.length;

  const showPrev = () => onChange(openIndex === null ? null : (openIndex - 1 + count) % count);
  const showNext = () => onChange(openIndex === null ? null : (openIndex + 1) % count);

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

  const item = openIndex !== null ? items[openIndex] : null;
  if (!item) return null;

  return createPortal(
    <div className="lightbox-backdrop" onClick={() => onChange(null)}>
      <div
        className="obw-card obw-card--dark lightbox"
        role="dialog"
        aria-modal="true"
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
        <button type="button" className="lightbox__close" aria-label={t('common.cancel')} onClick={() => onChange(null)}>
          <X size={18} aria-hidden />
        </button>

        {count > 1 ? (
          <button
            type="button"
            className="lightbox__nav lightbox__nav--prev"
            aria-label={t('album.previousMedia')}
            onClick={showPrev}>
            <ChevronLeft size={22} aria-hidden />
          </button>
        ) : null}

        {item.isVideo ? (
          <video className="lightbox__media" src={item.src} controls autoPlay />
        ) : (
          <img className="lightbox__media" src={item.src} alt={item.alt} />
        )}

        {count > 1 ? (
          <button
            type="button"
            className="lightbox__nav lightbox__nav--next"
            aria-label={t('album.nextMedia')}
            onClick={showNext}>
            <ChevronRight size={22} aria-hidden />
          </button>
        ) : null}

        {item.caption ? <p className="lightbox__caption">{item.caption}</p> : null}
      </div>
    </div>,
    document.body,
  );
}
