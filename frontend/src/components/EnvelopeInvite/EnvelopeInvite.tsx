import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';

import {
  WEDDING_CITY,
  WEDDING_VENUE_AREA,
  WEDDING_VENUE_NAME,
  formatWeddingDateDisplay,
} from '@/constants/weddingEvent';
import { useI18n } from '@/contexts/I18nContext';
import type { GreetingKind } from '@/services/inviteApi';
import { formatInviteGreeting, formatInviteHeadline } from './inviteGreeting';

import './styles/EnvelopeInvite.scss';

// When (ms after the text starts) a block begins to fade in.
const revealAt = (delayMs: number) => ({ '--reveal-delay': `${delayMs}ms` }) as CSSProperties;

type EnvelopeInviteProps = {
  token: string;
  greetingKind: GreetingKind;
  greetingName: string;
  greetingNames: string[];
};

const CONTACT_EMAIL = 'davide.ilaria@esempio.it';

// Real footage: seal breaks, flap opens, the parchment note slides out and
// fills the frame — its last frame already matches the letter's own
// background (same parchment art), so the cut to the HTML letter is seamless.
const OPENER_VIDEO_SRC = '/assets/wedding/green-letter.mp4';

// Native size of green-letter.mp4 — needed to compute how much bigger than
// `contain` the video has to grow to match the letter's `cover` background,
// and where its baked-in seal sits on screen. Re-measure these against the
// actual file any time the video is swapped — they're not derived at
// runtime from the source.
const VIDEO_NATURAL_WIDTH = 1220;
const VIDEO_NATURAL_HEIGHT = 1696;

// The video plays at its natural `contain` size (whole envelope visible,
// nothing cropped) until this point, then smoothly scales up to fill the
// screen like `cover` would. `object-fit` itself can't be transitioned —
// browsers snap between values — so this animates a CSS transform instead,
// which they interpolate. By ~4s the parchment already fills most of the
// frame on its own, so the added zoom is small and the CSS transition below
// has time to finish before the clip's natural end.
const ZOOM_START_SECONDS = 4;

// The text starts a little before the zoom does — the paper is already on
// its way out of the envelope, and waiting for the zoom made it feel late.
const TEXT_START_SECONDS = 3.5;

/**
 * Personalized envelope for the WhatsApp invite link. Closed by default —
 * tapping anywhere starts the opening video. When the paper is coming out of
 * the envelope (TEXT_START_SECONDS) the letter's text begins fading in block by
 * block directly over the footage, so the guest never sees a blank sheet;
 * the HTML parchment only takes over from the video once it has ended.
 */
export function EnvelopeInvite({ token, greetingKind, greetingName, greetingNames }: EnvelopeInviteProps) {
  const { locale, t } = useI18n();
  // isRevealing: the text is animating in over the video. isOpen: the video
  // has ended and the letter (parchment, links) has taken over.
  const [isRevealing, setIsRevealing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const letterHeadingRef = useRef<HTMLHeadingElement>(null);
  const openerVideoRef = useRef<HTMLVideoElement>(null);

  const greeting = formatInviteGreeting(t, locale, { kind: greetingKind, name: greetingName, names: greetingNames });

  useEffect(() => {
    if (isOpen) {
      // Sends keyboard/screen-reader focus into the revealed letter — the
      // CSS transition is purely visual, this is what makes the reveal
      // register for assistive tech too.
      letterHeadingRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <div
      className={`envelope-invite${isRevealing ? ' envelope-invite--revealing' : ''}${isZooming ? ' envelope-invite--zooming' : ''}${isOpen ? ' envelope-invite--open' : ''}`}>
      <div className="envelope-invite__stage" aria-hidden={isOpen}>
        <video
          ref={openerVideoRef}
          className={`envelope-invite__opener-video${isZooming ? ' envelope-invite__opener-video--zoomed' : ''}`}
          src={OPENER_VIDEO_SRC}
          playsInline
          muted
          preload="auto"
          onTimeUpdate={(event) => {
            const video = event.currentTarget;
            if (!isRevealing && video.currentTime >= TEXT_START_SECONDS) {
              setIsRevealing(true);
            }
            if (isZooming || video.currentTime < ZOOM_START_SECONDS) {
              return;
            }
            // How much bigger than `contain` the video needs to be to fill
            // the viewport the way `cover` (and the letter's background)
            // does — computed against the real screen, not guessed.
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
            // just the CSS zoom on top of it, keeps the paper from arriving
            // in the guest's face. The letter's text is already appearing
            // over it by now, so a slow ending doesn't leave a blank sheet.
            video.playbackRate = 0.4;
            setIsZooming(true);
          }}
          onEnded={() => setIsOpen(true)}
        />
        {!isVideoPlaying ? (
          <button
            type="button"
            className="envelope-invite__video-trigger"
            onClick={() => {
              void openerVideoRef.current?.play();
              setIsVideoPlaying(true);
            }}
            aria-label={t('invite.openAria')}
          />
        ) : null}
      </div>

      {!isOpen && !isVideoPlaying ? <p className="envelope-invite__hint">{t('invite.tapHint')}</p> : null}

      {/* Sibling of the (perspective:) stage, not a child — position: fixed
          needs to cover the real viewport, not the stage's containing block. */}
      {/* Parchment backdrop, separate from the text so it can fade in after
          the text has already started appearing over the video. */}
      <div className="envelope-invite__letter-bg" aria-hidden />

      <article className="envelope-invite__letter" aria-hidden={!isRevealing}>
        {/* Each block fades up in turn, at the delay given by revealAt(). */}
        <div className="envelope-invite__letter-content">
          <div className="envelope-invite__block" style={revealAt(250)}>
            <p className="obw-body envelope-invite__personal-greeting">{greeting}</p>
          </div>
          <div className="envelope-invite__block" style={revealAt(1150)}>
            <h1
              ref={letterHeadingRef}
              tabIndex={-1}
              className="obw-body envelope-invite__headline">
              {formatInviteHeadline(t, greetingKind)}
            </h1>
          </div>
          <div className="envelope-invite__block" style={revealAt(2050)}>
            <p className="obw-body envelope-invite__lead">{t('invite.weddingOf')}</p>
            <p className="obw-display envelope-invite__couple-names">{t('invite.coupleNames')}</p>
          </div>
          <div className="envelope-invite__block" style={revealAt(2950)}>
            <p className="obw-body envelope-invite__lead">{t('invite.takesPlace')}</p>
            <p className="obw-body envelope-invite__details">
              {`${formatWeddingDateDisplay(locale)}\n${WEDDING_VENUE_AREA}\n${WEDDING_VENUE_NAME}, ${WEDDING_CITY}`}
            </p>
          </div>
          <div className="envelope-invite__block" style={revealAt(3850)}>
            <p className="obw-body envelope-invite__ceremony-start">{t('invite.ceremonyStart')}</p>
            <p className="obw-body envelope-invite__body-text">{t('invite.intro')}</p>
          </div>
        </div>

        <div className="envelope-invite__sections">
          <section className="envelope-invite__section" style={revealAt(5200)}>
            <h2 className="obw-body envelope-invite__section-title">{t('invite.rsvpSection.title')}</h2>
            <p className="obw-body envelope-invite__rsvp-note">{t('invite.rsvpSection.note')}</p>
            <div className="envelope-invite__rsvp-actions">
              <Link
                className="obw-btn obw-btn--primary envelope-invite__cta"
                to={`/invito/${token}/rsvp`}
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

          <section className="envelope-invite__section envelope-invite__section--more-info" style={revealAt(6600)}>
            <p className="obw-body envelope-invite__more-info-text">{t('invite.moreInfo.text')}</p>
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
