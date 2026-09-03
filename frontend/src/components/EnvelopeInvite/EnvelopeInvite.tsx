import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { WEDDING_CITY, WEDDING_VENUE_AREA, WEDDING_VENUE_NAME, formatWeddingDateDisplay } from '@/constants/weddingEvent';
import { useI18n } from '@/contexts/I18nContext';
import './styles/EnvelopeInvite.scss';

type EnvelopeInviteProps = {
  firstName: string;
  lastName: string;
};

const CONTACT_EMAIL = 'davide.ilaria@esempio.it';
// Deliberately not WEDDING_OPERATION_NAME (still "Operazione Pirulini" on
// this branch) — this title card wants the couple's own English nickname
// for the wedding, independent of the site-wide constant.
const VIDEO_TITLE = "Pirulini's Wedding";

// How long the RSVP sections wait after the letter opens before fading in
// — after the quake/lightning/glitch reveal (see EnvelopeInvite.scss) has
// fully played out.
const SECTIONS_REVEAL_DELAY_MS = 1200;

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
// which they interpolate. Earlier than the clip's own end on purpose: the
// footage's own backdrop around the parchment (a light surface, not part of
// the site's dark palette) is only ever meant to be on screen briefly — the
// sooner the zoom crops it out, the less of it the guest actually sees.
const ZOOM_START_SECONDS = 3.3;

// Couple-names title, sovraimposto on the video itself while the flap is
// open and the parchment inside is visible but still blank. Starts at 3.0s,
// not when the flap first cracks open (~2.3s) — before ~2.9s the parchment
// is still a narrow wedge with dark envelope on both sides, and dark text
// loses all contrast sitting on dark green. Once shown it stays up — see
// hasShownTitleRef below — through the zoom and past the video's own
// natural end (frozen on its last frame), then fades out and the letter
// opens (see the nameRevealed effect), so the title is never yanked away
// mid-read.
const TITLE_START_SECONDS = 3.0;
// The title reveal shares this stretch of *footage* with the zoom into the
// letter. At normal speed that's well under a second of real time —
// nowhere near enough to read "Pirulini's Wedding".
// Slowing playback here (not just stretching the reveal via CSS) is what
// actually buys real reading time. Not too slow, though — much below this
// and the gap between the footage settling and the letter opening (the
// title now holds the screen on its own via TITLE_HOLD_MS, not the video)
// starts to feel like the video itself is dragging.
const SLOW_PLAYBACK_RATE = 0.6;
// How long the fully-revealed title stays up, on its own, before it fades
// and the letter opens — timed from the name's own fade-in finishing
// (TITLE_FADE_MS after showTitle flips true), not from the video.
const TITLE_HOLD_MS = 2000;
// Matches .envelope-invite__title-group's own opacity transition — the
// group must finish fading out before the letter opens, or the two overlap.
const TITLE_FADE_MS = 300;
// Vertical placement within the video's own rendered (contain-fit) box, not
// the screen — keeps the title on the blank upper parchment above the
// crest regardless of how much the viewport's aspect ratio letterboxes the
// video. 0 = top of the frame, 1 = bottom.
const TITLE_TOP_FRACTION = 0.3;

/**
 * Personalized envelope for the WhatsApp invite link. Closed by default —
 * tapping anywhere starts the opening video; the name fades in partway
 * through, holds for TITLE_HOLD_MS, fades out, and only then does the
 * letter open, each of its own lines fading in one after another.
 */
export function EnvelopeInvite({ firstName, lastName }: EnvelopeInviteProps) {
  const { locale, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [nameRevealed, setNameRevealed] = useState(false);
  const [sectionsVisible, setSectionsVisible] = useState(false);
  const letterHeadingRef = useRef<HTMLHeadingElement>(null);
  const openerVideoRef = useRef<HTMLVideoElement>(null);
  const hasSlowedRef = useRef(false);
  // Local mirror of `showTitle`, read synchronously inside onTimeUpdate —
  // the state setter's update wouldn't be visible until next render/tick,
  // and the position math below needs to know "has the title started"
  // within the very same tick it just flipped.
  const hasShownTitleRef = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const letterLines = useMemo(
    () => [
      t('invite.greeting', { firstName }),
      t('invite.headline'),
      t('invite.coupleNames'),
      `${formatWeddingDateDisplay(locale)}\n${WEDDING_VENUE_AREA}\n${WEDDING_VENUE_NAME}, ${WEDDING_CITY}`,
      t('invite.ceremonyStart'),
      t('invite.intro'),
    ],
    [t, firstName, locale],
  );
  useEffect(() => {
    if (isOpen) {
      // Sends keyboard/screen-reader focus into the revealed letter — the
      // CSS transition is purely visual, this is what makes the reveal
      // register for assistive tech too.
      letterHeadingRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSectionsVisible(false);
      return undefined;
    }
    const timeoutId = setTimeout(() => setSectionsVisible(true), SECTIONS_REVEAL_DELAY_MS);
    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  // Marks the name "revealed" once its own fade-in has finished, so the
  // hold below starts counting from a fully-visible title, not the instant
  // showTitle flips true.
  useEffect(() => {
    if (!showTitle) {
      return undefined;
    }
    const revealTimeoutId = setTimeout(() => setNameRevealed(true), TITLE_FADE_MS);
    return () => clearTimeout(revealTimeoutId);
  }, [showTitle]);

  // Once the name has held the screen on its own for TITLE_HOLD_MS (not
  // tied to the much shorter video runtime), it fades out, and once that
  // fade finishes the letter opens.
  useEffect(() => {
    if (!nameRevealed) {
      return undefined;
    }
    const holdTimeoutId = setTimeout(() => {
      setShowTitle(false);
    }, TITLE_HOLD_MS);
    return () => clearTimeout(holdTimeoutId);
  }, [nameRevealed]);

  useEffect(() => {
    if (!nameRevealed || showTitle) {
      return undefined;
    }
    const openTimeoutId = setTimeout(() => setIsOpen(true), TITLE_FADE_MS);
    return () => clearTimeout(openTimeoutId);
  }, [nameRevealed, showTitle]);

  return (
    <div className={`envelope-invite${isOpen ? ' envelope-invite--open' : ''}`}>
      <div className="envelope-invite__stage" ref={stageRef} aria-hidden={isOpen}>
        <video
          ref={openerVideoRef}
          className={`envelope-invite__opener-video${isZooming ? ' envelope-invite__opener-video--zoomed' : ''}`}
          src={OPENER_VIDEO_SRC}
          playsInline
          muted
          preload="auto"
          onTimeUpdate={(event) => {
            const video = event.currentTarget;
            if (!hasSlowedRef.current && video.currentTime >= TITLE_START_SECONDS) {
              hasSlowedRef.current = true;
              video.playbackRate = SLOW_PLAYBACK_RATE;
            }

            if (!hasShownTitleRef.current && video.currentTime >= TITLE_START_SECONDS) {
              hasShownTitleRef.current = true;
              setShowTitle(true);
            }
            if (hasShownTitleRef.current && stageRef.current) {
              // Same contain-fit math as the zoom scale below, computed early
              // so the title stays registered on the parchment inside the
              // video regardless of how the viewport letterboxes it.
              const containScale = Math.min(
                video.clientWidth / VIDEO_NATURAL_WIDTH,
                video.clientHeight / VIDEO_NATURAL_HEIGHT,
              );
              const renderedWidth = VIDEO_NATURAL_WIDTH * containScale;
              const renderedHeight = VIDEO_NATURAL_HEIGHT * containScale;
              const offsetLeft = (video.clientWidth - renderedWidth) / 2;
              const offsetTop = (video.clientHeight - renderedHeight) / 2;
              stageRef.current.style.setProperty('--title-left', `${offsetLeft}px`);
              stageRef.current.style.setProperty('--title-top', `${offsetTop + renderedHeight * TITLE_TOP_FRACTION}px`);
              stageRef.current.style.setProperty('--title-width', `${renderedWidth}px`);
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
            // Playback is already slowed (see hasSlowedRef, set back at
            // TITLE_START_SECONDS) — no separate rate change needed here,
            // just the CSS zoom class.
            setIsZooming(true);
          }}
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
        <div
          className={`envelope-invite__title-group${showTitle ? ' envelope-invite__title-group--visible' : ''}`}
          aria-hidden={!showTitle}>
          <p className="envelope-invite__intro-name">{VIDEO_TITLE}</p>
        </div>
      </div>

      {!isOpen && !isVideoPlaying ? <p className="envelope-invite__hint">{t('invite.tapHint')}</p> : null}

      {/* Sibling of the (perspective:) stage, not a child — position: fixed
          needs to cover the real viewport, not the stage's containing block. */}
      <article className="envelope-invite__letter" aria-hidden={!isOpen}>
        <div className={`envelope-invite__letter-content${isOpen ? ' is-revealed' : ''}`}>
          <p className="envelope-invite__personal-greeting">{letterLines[0]}</p>
          <h1 ref={letterHeadingRef} tabIndex={-1} className="obw-display obw-display--sm envelope-invite__greeting">
            {letterLines[1]}
          </h1>
          <p className="envelope-invite__couple-names">{letterLines[2]}</p>
          <p className="envelope-invite__details">{letterLines[3]}</p>
          <p className="envelope-invite__ceremony-start">{letterLines[4]}</p>
          <p className="obw-body envelope-invite__body-text">{letterLines[5]}</p>
        </div>

        <div className={`envelope-invite__sections${sectionsVisible ? ' envelope-invite__sections--visible' : ''}`}>
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
