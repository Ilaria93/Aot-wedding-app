import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  WEDDING_CITY,
  WEDDING_VENUE_AREA,
  WEDDING_VENUE_NAME,
  formatWeddingDateDisplay,
} from '@/constants/weddingEvent';
import { useI18n } from '@/contexts/I18nContext';

import './styles/EnvelopeInvite.scss';

type EnvelopeInviteProps = {
  firstName: string;
  lastName: string;
};

const CONTACT_EMAIL = 'davide.ilaria@esempio.it';

const GOOGLE_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${WEDDING_VENUE_AREA} ${WEDDING_VENUE_NAME} ${WEDDING_CITY}`,
)}`;

// Real footage: seal breaks, flap opens, the parchment note slides out and
// fills the frame — its last frame already matches the letter's own
// background (same parchment art), so the cut to the HTML letter is seamless.
const OPENER_VIDEO_SRC = '/assets/wedding/green-letter-2.mp4';

// Native size of green-letter-2.mp4 — needed to compute how much bigger than
// `contain` the video has to grow to match the letter's `cover` background,
// and where its baked-in seal sits on screen.
const VIDEO_NATURAL_WIDTH = 792;
const VIDEO_NATURAL_HEIGHT = 1160;

// The video plays at its natural `contain` size (whole envelope visible,
// nothing cropped) until this point, then smoothly scales up to fill the
// screen like `cover` would. `object-fit` itself can't be transitioned —
// browsers snap between values — so this animates a CSS transform instead,
// which they interpolate. By ~4s the parchment already fills most of the
// frame on its own, so the added zoom is small and the CSS transition below
// has time to finish before the clip's natural end.
const ZOOM_START_SECONDS = 4;

// Where the video's own baked-in wax seal sits, as a fraction of the
// video's native frame — measured by eye against the source footage. Our
// seal button sits exactly on top of it.
const SEAL_X_FRACTION = 0.503;
const SEAL_Y_FRACTION = 0.614;

/**
 * Personalized envelope for the WhatsApp invite link. Closed by default —
 * tapping the wax seal starts the opening video; once it ends, the letter
 * fades in with the guest's name.
 */
export function EnvelopeInvite({ firstName, lastName }: EnvelopeInviteProps) {
  const { locale, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [sealPosition, setSealPosition] = useState({ left: 0, top: 0 });
  const letterHeadingRef = useRef<HTMLHeadingElement>(null);
  const openerVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Sends keyboard/screen-reader focus into the revealed letter — the
      // CSS transition is purely visual, this is what makes the reveal
      // register for assistive tech too.
      letterHeadingRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    // The video sits `object-fit: contain` — depending on the screen's own
    // aspect ratio that leaves letterbox space on either the sides or top
    // and bottom. The seal button has to land on top of the video's own
    // seal regardless, so this re-derives its on-screen position from the
    // same contain math every time the viewport changes.
    function updateSealPosition() {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const containScale = Math.min(
        viewportWidth / VIDEO_NATURAL_WIDTH,
        viewportHeight / VIDEO_NATURAL_HEIGHT,
      );
      const contentWidth = VIDEO_NATURAL_WIDTH * containScale;
      const contentHeight = VIDEO_NATURAL_HEIGHT * containScale;
      const offsetX = (viewportWidth - contentWidth) / 2;
      const offsetY = (viewportHeight - contentHeight) / 2;
      setSealPosition({
        left: offsetX + SEAL_X_FRACTION * contentWidth,
        top: offsetY + SEAL_Y_FRACTION * contentHeight,
      });
    }

    updateSealPosition();
    window.addEventListener('resize', updateSealPosition);
    return () => window.removeEventListener('resize', updateSealPosition);
  }, []);

  return (
    <div className={`envelope-invite${isOpen ? ' envelope-invite--open' : ''}`}>
      <div className="envelope-invite__stage" aria-hidden={isOpen}>
        <video
          ref={openerVideoRef}
          className={`envelope-invite__opener-video${isZooming ? ' envelope-invite__opener-video--zoomed' : ''}`}
          src={OPENER_VIDEO_SRC}
          playsInline
          muted
          preload="auto"
          onTimeUpdate={(event) => {
            if (isZooming || event.currentTarget.currentTime < ZOOM_START_SECONDS) {
              return;
            }
            // How much bigger than `contain` the video needs to be to fill
            // the viewport the way `cover` (and the letter's background)
            // does — computed against the real screen, not guessed.
            const video = event.currentTarget;
            const containScale = Math.min(
              video.clientWidth / VIDEO_NATURAL_WIDTH,
              video.clientHeight / VIDEO_NATURAL_HEIGHT,
            );
            const coverScale = Math.max(
              video.clientWidth / VIDEO_NATURAL_WIDTH,
              video.clientHeight / VIDEO_NATURAL_HEIGHT,
            );
            video.style.setProperty('--zoom-scale', String(coverScale / containScale));
            // The footage's own last second (the paper filling the frame)
            // plays out quickly on its own — slowing playback here, not
            // just the CSS zoom on top of it, is what actually makes the
            // ending feel unhurried instead of stacking a slow zoom onto a
            // fast clip.
            video.playbackRate = 0.35;
            setIsZooming(true);
          }}
          onEnded={() => setIsOpen(true)}
        />
        {!isVideoPlaying ? (
          <button
            type="button"
            className="envelope-invite__video-trigger"
            style={{ left: `${sealPosition.left}px`, top: `${sealPosition.top}px` }}
            onClick={() => {
              void openerVideoRef.current?.play();
              setIsVideoPlaying(true);
            }}
            aria-label={t('invite.openAria')}>
            <img
              className="envelope-invite__video-trigger-seal"
              src="/assets/wedding/cera-rosso.webp"
              alt=""
              width={1614}
              height={1500}
              loading="eager"
              decoding="async"
            />
          </button>
        ) : null}
      </div>

      {!isOpen && !isVideoPlaying ? <p className="envelope-invite__hint">{t('invite.tapHint')}</p> : null}

      {/* Sibling of the (perspective:) stage, not a child — position: fixed
          needs to cover the real viewport, not the stage's containing block. */}
      <article className="envelope-invite__letter" aria-hidden={!isOpen}>
        <div className="envelope-invite__letter-content">
          <p className="envelope-invite__personal-greeting">{t('invite.greeting', { firstName })}</p>
          <h1
            ref={letterHeadingRef}
            tabIndex={-1}
            className="obw-display obw-display--sm envelope-invite__greeting">
            {t('invite.headline')}
          </h1>
          <p className="envelope-invite__couple-names">{t('invite.coupleNames')}</p>
          <p className="envelope-invite__details">
            {formatWeddingDateDisplay(locale)}
            <br />
            {WEDDING_VENUE_AREA}
            <br />
            {WEDDING_VENUE_NAME}, {WEDDING_CITY}
          </p>
          <p className="envelope-invite__ceremony-start">{t('invite.ceremonyStart')}</p>
          <p className="obw-body envelope-invite__body-text">{t('invite.intro')}</p>
        </div>

        <div className="envelope-invite__sections">
          <section className="envelope-invite__section">
            <h2 className="envelope-invite__section-title">{t('invite.directions.title')}</h2>
            <div className="envelope-invite__map-placeholder" aria-hidden="true">
              <MapPin size={22} strokeWidth={1.5} />
              <span>{t('invite.directions.mapLabel')}</span>
            </div>
            <p className="envelope-invite__address">
              {WEDDING_VENUE_AREA} — {WEDDING_VENUE_NAME}, {WEDDING_CITY}.{' '}
              {t('invite.directions.parkingNote')}
            </p>
            <a
              className="obw-btn obw-btn--secondary envelope-invite__maps-link"
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noreferrer">
              {t('invite.directions.openMaps')}
            </a>
          </section>

          <section className="envelope-invite__section">
            <h2 className="envelope-invite__section-title">{t('invite.rsvpSection.title')}</h2>
            <p className="envelope-invite__rsvp-note">{t('invite.rsvpSection.note')}</p>
            <div className="envelope-invite__rsvp-actions">
              <Link
                className="obw-btn obw-btn--primary envelope-invite__cta"
                to="/auth/register"
                state={{ from: '/rsvp', prefill: { firstName, lastName } }}
                tabIndex={isOpen ? 0 : -1}>
                {t('invite.rsvpSection.yes')}
              </Link>
              <a
                className="obw-btn obw-btn--secondary envelope-invite__contact"
                href={`mailto:${CONTACT_EMAIL}`}
                tabIndex={isOpen ? 0 : -1}>
                {t('invite.rsvpSection.contact')}
              </a>
            </div>
          </section>

          <section className="envelope-invite__section envelope-invite__section--more-info">
            <p className="envelope-invite__more-info-text">{t('invite.moreInfo.text')}</p>
            <Link
              className="obw-btn obw-btn--secondary envelope-invite__more-info-link"
              to="/"
              tabIndex={isOpen ? 0 : -1}>
              {t('invite.moreInfo.cta')}
            </Link>
          </section>
        </div>
      </article>
    </div>
  );
}
