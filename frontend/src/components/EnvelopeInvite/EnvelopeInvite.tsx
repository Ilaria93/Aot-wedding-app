import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { ParticleLine } from '@/components/EnvelopeInvite/ParticleLine';
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
// Deliberately not WEDDING_OPERATION_NAME (still "Operazione Pirulini" on
// this branch) — this title card wants the couple's own English nickname
// for the wedding, independent of the site-wide constant.
const VIDEO_TITLE = "Pirulini's Wedding";

// Typewriter pacing for the letter's opening lines: each line's own type
// duration scales with its length but is clamped so a long paragraph
// doesn't drag on forever, and lines run one after another (never two
// typing at once).
const TYPE_START_DELAY_MS = 200;
const TYPE_MS_PER_CHAR = 38;
const TYPE_MIN_LINE_MS = 320;
// High enough that the short identity lines (greeting, headline, names,
// date/venue, ceremony time) never hit it and all type at the same
// TYPE_MS_PER_CHAR pace — only the long intro paragraph gets compressed,
// and only mildly, instead of every line past it visibly speeding up.
const TYPE_MAX_LINE_MS = 1900;
const TYPE_LINE_GAP_MS = 180;
const TYPE_SECTIONS_GAP_MS = 400;

export type TypedLine = { text: string; startMs: number; endMs: number };

export function buildTypeSchedule(lines: string[]): TypedLine[] {
  let cursor = TYPE_START_DELAY_MS;
  return lines.map((text) => {
    const duration = Math.min(TYPE_MAX_LINE_MS, Math.max(TYPE_MIN_LINE_MS, text.length * TYPE_MS_PER_CHAR));
    const startMs = cursor;
    const endMs = startMs + duration;
    cursor = endMs + TYPE_LINE_GAP_MS;
    return { text, startMs, endMs };
  });
}

/** Pure reveal math, kept separate from the rAF/state plumbing below so it
 * can be unit-tested without a DOM or a fake clock. */
export function computeTypeReveal(schedule: TypedLine[], elapsed: number, done: boolean) {
  const revealed = schedule.map(({ text, startMs, endMs }) => {
    if (done || elapsed >= endMs) {
      return text;
    }
    if (elapsed <= startMs) {
      return '';
    }
    const progress = (elapsed - startMs) / (endMs - startMs);
    return text.slice(0, Math.round(text.length * progress));
  });
  const activeIndex = done ? -1 : schedule.findIndex(({ startMs, endMs }) => elapsed > startMs && elapsed < endMs);
  return { revealed, activeIndex };
}

/** Types `lines` out one at a time while `active`; skips straight to the
 * full text for prefers-reduced-motion. Returns the revealed substrings
 * plus the index of the line currently mid-type (-1 once all are done).
 * `lines` must be a referentially stable array (e.g. via useMemo) — a new
 * array every render would retrigger the effect below on every animation
 * frame and the text would never advance past empty. */
function useTypewriterLines(lines: string[], active: boolean) {
  const schedule = useMemo(() => buildTypeSchedule(lines), [lines]);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      setDone(false);
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDone(true);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const totalEnd = schedule[schedule.length - 1]?.endMs ?? 0;
    const tick = (now: number) => {
      const e = now - start;
      if (e >= totalEnd) {
        setElapsed(totalEnd);
        setDone(true);
        return;
      }
      setElapsed(e);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, schedule]);

  const { revealed, activeIndex } = computeTypeReveal(schedule, elapsed, done);

  return { revealed, activeIndex, done };
}

/** Renders `text` as one span per character, each with a fixed `animation-delay`
 * spread across [startMs, endMs] (the same window `buildTypeSchedule` gave this
 * line) so a pure CSS keyframe fades it in — see `.envelope-invite__char` in
 * EnvelopeInvite.scss. Deliberately NOT driven by the live `revealed` state:
 * an earlier version toggled a class on every one of ~200 character spans on
 * every animation-frame re-render, and with that many elements each running
 * their own CSS *transition*, the transitions never settled — every span sat
 * stuck at a low mid-fade opacity indefinitely (confirmed by forcing
 * `transition: none`, which snapped them to the correct full opacity
 * instantly). A `startMs`/`endMs` pair is static for a line's whole life, so
 * this component's props never change after mount — zero re-renders, and the
 * browser's own compositor drives the fade instead of React/JS. */
const TypedText = memo(function TypedText({ text, startMs, endMs }: { text: string; startMs: number; endMs: number }) {
  const chars = useMemo(() => {
    const duration = endMs - startMs;
    return text.split('').map((char, index) => ({
      char,
      delayMs: text.length > 0 ? startMs + (index / text.length) * duration : startMs,
    }));
  }, [text, startMs, endMs]);
  return (
    <>
      {chars.map(({ char, delayMs }, index) => (
        <span key={index} className="envelope-invite__char" style={{ animationDelay: `${delayMs}ms` }}>
          {char}
        </span>
      ))}
    </>
  );
});

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

// The letter starts revealing (and typing) this many seconds before the
// video's own end, instead of waiting for onEnded — the video keeps playing
// underneath (it never fades, see the stage comment below), so the last
// second of the seal/flap footage and the first lines of the letter overlap
// instead of the text only starting once the clip has fully stopped.
const LETTER_REVEAL_LEAD_SECONDS = 1;

// Couple-names title, sovraimposto on the video itself while the flap is
// open and the parchment inside is visible but still blank. Starts at 3.0s,
// not when the flap first cracks open (~2.3s) — before ~2.9s the parchment
// is still a narrow wedge with dark envelope on both sides, and dark text
// loses all contrast sitting on dark green. Ends before ZOOM_START_SECONDS
// so it never overlaps the zoom-in. A title card before the letter's own
// typed "Davide & Ilaria" line, which echoes it a few seconds later.
const TITLE_START_SECONDS = 3.0;
const TITLE_END_SECONDS = 3.9;
// Vertical placement within the video's own rendered (contain-fit) box, not
// the screen — keeps the title on the blank upper parchment above the
// crest regardless of how much the viewport's aspect ratio letterboxes the
// video. 0 = top of the frame, 1 = bottom.
const TITLE_TOP_FRACTION = 0.3;

/**
 * Personalized envelope for the WhatsApp invite link. Closed by default —
 * tapping anywhere starts the opening video; the letter starts fading in
 * and typing during the video's last second (see LETTER_REVEAL_LEAD_SECONDS),
 * overlapping the tail of the footage instead of waiting for it to fully end.
 */
export function EnvelopeInvite({ firstName, lastName }: EnvelopeInviteProps) {
  const { locale, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [sectionsVisible, setSectionsVisible] = useState(false);
  const letterHeadingRef = useRef<HTMLHeadingElement>(null);
  const openerVideoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Memoized so the array keeps the same reference across re-renders
  // (including the ones the typing animation itself triggers) — otherwise
  // useTypewriterLines' effect sees a "new" lines array on every tick, tears
  // down and restarts the animation loop before it can accumulate any
  // elapsed time, and the text never advances past empty.
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
  const { activeIndex, done: typingDone } = useTypewriterLines(letterLines, isOpen);
  // Static per-line windows for TypedText's animation-delay — see its own
  // comment for why the char fade is driven by this instead of live state.
  const schedule = useMemo(() => buildTypeSchedule(letterLines), [letterLines]);

  useEffect(() => {
    if (isOpen) {
      // Sends keyboard/screen-reader focus into the revealed letter — the
      // CSS transition is purely visual, this is what makes the reveal
      // register for assistive tech too.
      letterHeadingRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!typingDone) {
      setSectionsVisible(false);
      return;
    }
    const timeoutId = setTimeout(() => setSectionsVisible(true), TYPE_SECTIONS_GAP_MS);
    return () => clearTimeout(timeoutId);
  }, [typingDone]);

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
            if (!isOpen && video.duration - video.currentTime <= LETTER_REVEAL_LEAD_SECONDS) {
              setIsOpen(true);
            }

            const shouldShowTitle =
              !isOpen && video.currentTime >= TITLE_START_SECONDS && video.currentTime < TITLE_END_SECONDS;
            setShowTitle((current) => (current === shouldShowTitle ? current : shouldShowTitle));
            if (shouldShowTitle && stageRef.current) {
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
            // The footage's own last second (the paper filling the frame)
            // plays out quickly on its own — slowing playback here, not
            // just the CSS zoom on top of it, is what actually makes the
            // ending feel unhurried instead of stacking a slow zoom onto a
            // fast clip. Keep this above ~0.5 or the gap before the letter's
            // text appears drags.
            video.playbackRate = 0.55;
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
        <p
          className={`envelope-invite__title${showTitle ? ' envelope-invite__title--visible' : ''}`}
          aria-hidden={!showTitle}>
          {VIDEO_TITLE}
          <ParticleLine text={VIDEO_TITLE} startMs={0} active={showTitle} />
        </p>
      </div>

      {!isOpen && !isVideoPlaying ? <p className="envelope-invite__hint">{t('invite.tapHint')}</p> : null}

      {/* Sibling of the (perspective:) stage, not a child — position: fixed
          needs to cover the real viewport, not the stage's containing block. */}
      <article className="envelope-invite__letter" aria-hidden={!isOpen}>
        <div className="envelope-invite__letter-content">
          <p
            className={`envelope-invite__personal-greeting${activeIndex === 0 ? ' is-typing' : ''}`}>
            <TypedText text={letterLines[0]} startMs={schedule[0].startMs} endMs={schedule[0].endMs} />
            <ParticleLine text={letterLines[0]} startMs={schedule[0].startMs} active={isOpen} />
          </p>
          <h1
            ref={letterHeadingRef}
            tabIndex={-1}
            className={`obw-display obw-display--sm envelope-invite__greeting${activeIndex === 1 ? ' is-typing' : ''}`}>
            <TypedText text={letterLines[1]} startMs={schedule[1].startMs} endMs={schedule[1].endMs} />
            <ParticleLine text={letterLines[1]} startMs={schedule[1].startMs} active={isOpen} />
          </h1>
          <p className={`envelope-invite__couple-names${activeIndex === 2 ? ' is-typing' : ''}`}>
            <TypedText text={letterLines[2]} startMs={schedule[2].startMs} endMs={schedule[2].endMs} />
            <ParticleLine text={letterLines[2]} startMs={schedule[2].startMs} active={isOpen} />
          </p>
          <p className={`envelope-invite__details${activeIndex === 3 ? ' is-typing' : ''}`}>
            <TypedText text={letterLines[3]} startMs={schedule[3].startMs} endMs={schedule[3].endMs} />
            <ParticleLine text={letterLines[3]} startMs={schedule[3].startMs} active={isOpen} />
          </p>
          <p className={`envelope-invite__ceremony-start${activeIndex === 4 ? ' is-typing' : ''}`}>
            <TypedText text={letterLines[4]} startMs={schedule[4].startMs} endMs={schedule[4].endMs} />
            <ParticleLine text={letterLines[4]} startMs={schedule[4].startMs} active={isOpen} />
          </p>
          <p className={`obw-body envelope-invite__body-text${activeIndex === 5 ? ' is-typing' : ''}`}>
            <TypedText text={letterLines[5]} startMs={schedule[5].startMs} endMs={schedule[5].endMs} />
            <ParticleLine text={letterLines[5]} startMs={schedule[5].startMs} active={isOpen} />
          </p>
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
