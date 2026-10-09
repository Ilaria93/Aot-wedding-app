import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react';
import { ChevronDown, Copy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import {
  WEDDING_CITY,
  WEDDING_VENUE_AREA,
  WEDDING_VENUE_NAME,
  formatWeddingDateDisplay,
} from '@/constants/weddingEvent';
import { copyToClipboard } from '@/components/HoneymoonGiftSection/copyToClipboard';
import { AddToCalendarButton } from '@/components/AddToCalendarButton';
import { CoupleContactDialog } from '@/components/Landing/CoupleContactDialog';
import { DeclineDialog } from './DeclineDialog';
import { formatIbanForDisplay, HONEYMOON_GIFT_BANK_DETAILS } from '@/constants/honeymoonGift';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { confirmGuestRsvp } from '@/services/guestAccessApi';
import type { GreetingKind } from '@/services/inviteApi';
import { formatInviteGreeting, formatInviteHeadline, isPluralInvite } from './inviteGreeting';

import './styles/EnvelopeInvite.scss';

// When (ms after the text starts) a block begins to fade in.
const revealAt = (delayMs: number) => ({ '--reveal-delay': `${delayMs}ms` }) as CSSProperties;

// Every line of the letter is revealed one word at a time (each word fades in
// from a blur and rises a little), one after the other down the page. Plain
// spans and CSS transitions — see .envelope-invite__word.
const TEXT_START_DELAY_MS = 250;
const WORD_STEP_MS = 100;
const LINE_PAUSE_MS = 250;
// How slowly the page follows the text down while it is written (bigger = softer).
const SCROLL_EASE_MS = 1400;
const SCROLL_MAX_PX_PER_S = 48;

function countWords(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

// `startMs` is when the first word begins (after the text starts); newlines in
// `text` stay line breaks (the paragraph that uses them is `white-space: pre-line`).
function WordReveal({ text, startMs, stepMs = WORD_STEP_MS }: { text: string; startMs: number; stepMs?: number }) {
  let index = 0;
  return (
    <>
      {text.split('\n').map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 ? '\n' : null}
          {line
            .split(/\s+/)
            .filter(Boolean)
            .map((word, wordIndex, lineWords) => {
              const delay = startMs + index++ * stepMs;
              return (
                <Fragment key={`${word}-${wordIndex}`}>
                  <span className="envelope-invite__word" style={{ '--word-delay': `${delay}ms` } as CSSProperties}>
                    {word}
                  </span>
                  {wordIndex < lineWords.length - 1 ? ' ' : null}
                </Fragment>
              );
            })}
        </Fragment>
      ))}
    </>
  );
}

type EnvelopeInviteProps = {
  token: string;
  greetingKind: GreetingKind;
  greetingName: string;
  greetingNames: string[];
};

// Real footage: seal breaks, flap opens, the parchment note slides out and
// fills the frame — its last frame already matches the letter's own
// background (same parchment art), so the cut to the HTML letter is seamless.
// 960px-wide re-encode of green-letter.mp4 (~1 MB instead of 5.4 MB, no audio
// track): the original stalled on phones while it loaded.
const OPENER_VIDEO_SRC = '/assets/wedding/green-letter-web.mp4';

// First frame of the clip. iPhone Safari doesn't paint a video's first frame
// until the viewer taps (it ignores preload), so without this the sealed
// envelope is invisible and the screen looks empty.
const OPENER_VIDEO_POSTER = '/assets/wedding/green-letter-poster.webp';

// Native size of green-letter-web.mp4 — needed to compute how much bigger than
// `contain` the video has to grow to match the letter's `cover` background,
// and where its baked-in seal sits on screen. Re-measure these against the
// actual file any time the video is swapped — they're not derived at
// runtime from the source.
const VIDEO_NATURAL_WIDTH = 960;
const VIDEO_NATURAL_HEIGHT = 1334;

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
const TEXT_START_SECONDS = 3;

// Longest the text waits for the display font before showing anyway.
const FONT_WAIT_MS = 2500;

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
  const [contactOpen, setContactOpen] = useState(false);
  const [ibanCopied, setIbanCopied] = useState(false);
  const navigate = useNavigate();
  const { applySession } = useAuth();
  // True until the reader scrolls: shows the "keep going" chevron for people who stopped the auto-scroll.
  const [atTop, setAtTop] = useState(true);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [declineError, setDeclineError] = useState<string | null>(null);

  // "No" is answered right here, after one "are you sure?": no need to open the site. The saved answer
  // can still be changed by reopening the link (the answer page offers "Modifica" until the deadline).
  async function handleDecline() {
    setDeclining(true);
    setDeclineError(null);
    try {
      const result = await confirmGuestRsvp(token, { attending: false, guests: [] });
      await applySession(result.user);
      navigate(`/invito/${token}/rsvp`, { state: { thanks: true } });
    } catch {
      setDeclineError(t('invite.decline.error'));
      setDeclining(false);
    }
  }

  async function handleCopyIban() {
    if (!(await copyToClipboard(HONEYMOON_GIFT_BANK_DETAILS.iban))) {
      return;
    }
    setIbanCopied(true);
    window.setTimeout(() => setIbanCopied(false), 2200);
  }
  const letterHeadingRef = useRef<HTMLHeadingElement>(null);
  const openerVideoRef = useRef<HTMLVideoElement>(null);
  const letterRef = useRef<HTMLElement>(null);
  // Read from the frame loop below, which must not see stale state.
  const revealedRef = useRef(false);
  const zoomedRef = useRef(false);
  const fontReadyRef = useRef(false);
  const textDueRef = useRef(false);

  // Where the next word starts: each line begins after the previous one has
  // finished, so the words arrive in reading order and the sections below wait
  // for the last of them.
  let cursor = TEXT_START_DELAY_MS;
  const words = (text: string) => {
    const element = <WordReveal text={text} startMs={cursor} />;
    cursor += countWords(text) * WORD_STEP_MS + LINE_PAUSE_MS;
    return element;
  };

  const plural = isPluralInvite(greetingKind);
  const greeting = formatInviteGreeting(t, locale, { kind: greetingKind, name: greetingName, names: greetingNames });

  // The text starts when the video reaches TEXT_START_SECONDS *and* the display
  // font is in, so the greeting is never first drawn in a fallback face and then
  // swapped.
  function startTextIfReady() {
    if (!revealedRef.current && textDueRef.current && fontReadyRef.current) {
      revealedRef.current = true;
      setIsRevealing(true);
    }
  }

  // Google Fonts only downloads Great Vibes when something needs it; ask for it
  // as soon as the envelope is on screen, long before the text is due.
  useEffect(() => {
    const markReady = () => {
      fontReadyRef.current = true;
      startTextIfReady();
    };
    if (document.fonts) {
      document.fonts.load('1em "Great Vibes"').then(markReady, markReady);
    } else {
      markReady();
    }
  }, []);

  // Starts the text and the zoom once the video has reached these moments.
  function advance(video: HTMLVideoElement, mediaTime: number) {
    if (mediaTime >= TEXT_START_SECONDS && !textDueRef.current) {
      textDueRef.current = true;
      // A slow connection can hold the text back, but not for more than this.
      setTimeout(() => {
        fontReadyRef.current = true;
        startTextIfReady();
      }, FONT_WAIT_MS);
      startTextIfReady();
    }
    if (zoomedRef.current || mediaTime < ZOOM_START_SECONDS) {
      return;
    }
    zoomedRef.current = true;
    // How much bigger than `contain` the video needs to be to fill the
    // viewport the way `cover` (and the letter's background) does — computed
    // against the real screen, not guessed.
    const containScale = Math.min(video.clientWidth / VIDEO_NATURAL_WIDTH, video.clientHeight / VIDEO_NATURAL_HEIGHT);
    const coverScale = Math.max(video.clientWidth / VIDEO_NATURAL_WIDTH, video.clientHeight / VIDEO_NATURAL_HEIGHT);
    video.style.setProperty('--zoom-scale', String(coverScale / containScale));
    // The footage's own last second (the paper filling the frame) plays out
    // quickly on its own — slowing playback here, not just the CSS zoom on top
    // of it, keeps the paper from arriving in the guest's face. The letter's
    // text is already appearing over it by now, so a slow ending doesn't leave
    // a blank sheet.
    video.playbackRate = 0.4;
    setIsZooming(true);
  }

  // Driven by the frames actually shown, not by the media clock: on a phone
  // that is still loading or decoding, the clock can run ahead of the picture
  // and the text would appear over the closed envelope. Safari 15.4+ and
  // current Chrome have requestVideoFrameCallback; elsewhere onTimeUpdate below
  // does the job.
  useEffect(() => {
    const video = openerVideoRef.current;
    if (!isVideoPlaying || !video || typeof video.requestVideoFrameCallback !== 'function') {
      return undefined;
    }
    let handle = 0;
    const onFrame = (_now: number, metadata: VideoFrameCallbackMetadata) => {
      advance(video, metadata.mediaTime);
      if (!zoomedRef.current) {
        handle = video.requestVideoFrameCallback(onFrame);
      }
    };
    handle = video.requestVideoFrameCallback(onFrame);
    return () => video.cancelVideoFrameCallback(handle);
  }, [isVideoPlaying]);

  useEffect(() => {
    if (isOpen) {
      // Sends keyboard/screen-reader focus into the revealed letter — the
      // CSS transition is purely visual, this is what makes the reveal
      // register for assistive tech too.
      letterHeadingRef.current?.focus();
    }
  }, [isOpen]);

  // Nobody guesses the letter scrolls: while the text is being written the page
  // follows it down, easing so the line being revealed stays in view. Any touch,
  // wheel or key press hands control back to the reader.
  useEffect(() => {
    const letter = letterRef.current;
    if (!isRevealing || !letter) {
      return;
    }
    const startedAt = performance.now();
    const items = Array.from(letter.querySelectorAll<HTMLElement>('.envelope-invite__word, .envelope-invite__fade')).map(
      (element) => {
        const style = element.style;
        const delay = parseFloat(style.getPropertyValue('--word-delay') || style.getPropertyValue('--reveal-delay')) || 0;
        return { element, delay };
      },
    );
    const lastDelay = Math.max(0, ...items.map((item) => item.delay));
    let frame = 0;
    let position = letter.scrollTop; // fractional: scrollTop itself rounds to whole pixels
    let lastFrame = startedAt;
    const stop = () => cancelAnimationFrame(frame);
    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const dt = Math.min(now - lastFrame, 64);
      lastFrame = now;
      const letterTop = letter.getBoundingClientRect().top;
      let bottom = 0;
      for (const item of items) {
        if (item.delay <= elapsed) {
          bottom = Math.max(bottom, item.element.getBoundingClientRect().bottom - letterTop + letter.scrollTop);
        }
      }
      // Exponential easing (time constant SCROLL_EASE_MS): starts gently, glides, never snaps.
      const wanted = bottom + 72 - letter.clientHeight;
      const behind = wanted - position > 0.5 && position < letter.scrollHeight - letter.clientHeight - 0.5;
      if (behind) {
        const eased = (wanted - position) * (1 - Math.exp(-dt / SCROLL_EASE_MS));
        position += Math.min(eased, (SCROLL_MAX_PX_PER_S * dt) / 1000);
        letter.scrollTop = position;
      }
      if (behind || elapsed < lastDelay + 1500) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    const events = ['touchstart', 'wheel', 'keydown', 'pointerdown'] as const;
    events.forEach((name) => letter.addEventListener(name, stop, { passive: true }));
    window.addEventListener('keydown', stop);
    return () => {
      stop();
      events.forEach((name) => letter.removeEventListener(name, stop));
      window.removeEventListener('keydown', stop);
    };
  }, [isRevealing]);

  return (
    <div
      className={`envelope-invite${isRevealing ? ' envelope-invite--revealing' : ''}${isZooming ? ' envelope-invite--zooming' : ''}${isOpen ? ' envelope-invite--open' : ''}`}>
      <div className="envelope-invite__stage" aria-hidden={isOpen}>
        <video
          ref={openerVideoRef}
          className={`envelope-invite__opener-video${isZooming ? ' envelope-invite__opener-video--zoomed' : ''}`}
          src={OPENER_VIDEO_SRC}
          poster={OPENER_VIDEO_POSTER}
          playsInline
          muted
          preload="auto"
          onTimeUpdate={(event) => {
            const video = event.currentTarget;
            if (typeof video.requestVideoFrameCallback !== 'function') {
              advance(video, video.currentTime);
            }
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

      <article
        ref={letterRef}
        className="envelope-invite__letter"
        aria-hidden={!isRevealing}
        onScroll={(event) => setAtTop(event.currentTarget.scrollTop < 24)}>
        {/* The text comes in word by word (words()); the buttons and the rules above the sections fade in after their text, at revealAt(). */}
        <div className="envelope-invite__letter-body">
          <div className="envelope-invite__letter-content">
            <div className="envelope-invite__block">
              <p className="obw-body envelope-invite__personal-greeting">{words(greeting)}</p>
            </div>
            <div className="envelope-invite__block">
              <p className="obw-body envelope-invite__mission">{words(t(plural ? 'invite.missionPlural' : 'invite.mission'))}</p>
              <h1 ref={letterHeadingRef} tabIndex={-1} className="obw-body envelope-invite__headline">
                {words(formatInviteHeadline(t, greetingKind))}
              </h1>
            </div>
            <div className="envelope-invite__block">
              <p className="obw-body envelope-invite__lead envelope-invite__of">{words(t('invite.meetingPoint'))}</p>
              <p className="obw-body envelope-invite__details">
                {words(`${WEDDING_VENUE_AREA}\n${WEDDING_VENUE_NAME}, ${WEDDING_CITY}`)}
              </p>
            </div>
            <div className="envelope-invite__block">
              <p className="obw-body envelope-invite__lead envelope-invite__of">{words(t('invite.whenLabel'))}</p>
              <p className="obw-body envelope-invite__details">
                {words(t('invite.dateAndTime', { date: formatWeddingDateDisplay(locale) }))}
              </p>
              <div className="envelope-invite__fade envelope-invite__calendar" style={revealAt(cursor)}>
                <AddToCalendarButton tabIndex={isOpen ? 0 : -1} />
              </div>
            </div>
            <div className="envelope-invite__block">
              <p className="obw-body envelope-invite__body-text">{words(t(plural ? 'invite.closingPlural' : 'invite.closing'))}</p>
              <p className="obw-display envelope-invite__couple-names">{words(t('invite.coupleNames'))}</p>
            </div>
          </div>

          <div className="envelope-invite__sections">
            <section className="envelope-invite__section" style={revealAt(cursor)}>
              <h2 className="obw-body envelope-invite__section-title">{words(t(plural ? 'invite.rsvpSection.titlePlural' : 'invite.rsvpSection.title'))}</h2>
              <p className="obw-body envelope-invite__rsvp-note">{words(t(plural ? 'invite.rsvpSection.notePlural' : 'invite.rsvpSection.note'))}</p>
              {/* Both answers one tap away. "No" opens the answer page with No already
                  chosen: nothing is saved until the guest confirms there. */}
              <div className="envelope-invite__rsvp-actions envelope-invite__fade" style={revealAt(cursor)}>
                <Link
                  className="obw-btn obw-btn--primary envelope-invite__cta"
                  to={`/invito/${token}/rsvp`}
                  state={{ yes: true }}
                  tabIndex={isOpen ? 0 : -1}>
                  {t(plural ? 'invite.rsvpSection.yesPlural' : 'invite.rsvpSection.yes')}
                </Link>
                <button
                  type="button"
                  className="obw-btn obw-btn--secondary envelope-invite__decline"
                  tabIndex={isOpen ? 0 : -1}
                  onClick={() => setDeclineOpen(true)}>
                  {t(plural ? 'invite.rsvpSection.noPlural' : 'invite.rsvpSection.no')}
                </button>
              </div>
              <p className="obw-body envelope-invite__rsvp-hint envelope-invite__fade" style={revealAt(cursor)}>
                {t(plural ? 'invite.rsvpSection.yesHintPlural' : 'invite.rsvpSection.yesHint')}
              </p>
            </section>

            <section className="envelope-invite__section envelope-invite__section--gift" style={revealAt(cursor + 500)}>
              <p className="obw-body envelope-invite__gift-text">{words(t(plural ? 'invite.gift.textPlural' : 'invite.gift.text'))}</p>
              <div className="envelope-invite__gift-details envelope-invite__fade" style={revealAt(cursor)}>
                <span className="envelope-invite__gift-holder">{HONEYMOON_GIFT_BANK_DETAILS.accountHolder}</span>
                <strong className="envelope-invite__gift-iban">{formatIbanForDisplay(HONEYMOON_GIFT_BANK_DETAILS.iban)}</strong>
                <button
                  type="button"
                  className="obw-btn obw-btn--secondary envelope-invite__contact envelope-invite__gift-copy"
                  tabIndex={isOpen ? 0 : -1}
                  onClick={() => void handleCopyIban()}>
                  <Copy size={14} aria-hidden />
                  {ibanCopied ? t('landing.gift.copiedIban') : t('landing.gift.copyIban')}
                </button>
              </div>
            </section>

            <section className="envelope-invite__section envelope-invite__section--more-info" style={revealAt(cursor + 500)}>
              <p className="obw-body envelope-invite__more-info-text">
                {words(t(plural ? 'invite.moreInfo.textPlural' : 'invite.moreInfo.text'))}
              </p>
              <div className="envelope-invite__rsvp-actions envelope-invite__fade" style={revealAt(cursor)}>
                <Link
                  className="obw-btn obw-btn--secondary envelope-invite__more-info-link"
                  to="/"
                  tabIndex={isOpen ? 0 : -1}>
                  {t('invite.moreInfo.cta')}
                </Link>
                <button
                  type="button"
                  className="obw-btn obw-btn--secondary envelope-invite__contact"
                  tabIndex={isOpen ? 0 : -1}
                  onClick={() => setContactOpen(true)}>
                  {t('invite.rsvpSection.contact')}
                </button>
              </div>
            </section>
          </div>
        </div>
      </article>

      {/* Blinking gold chevron at the bottom right of the first screen; it goes away as soon as the letter scrolls. */}
      {isOpen && atTop ? (
        <button
          type="button"
          className="envelope-invite__scroll-hint"
          aria-label={t('invite.scrollHint')}
          onClick={() => letterRef.current?.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' })}>
          <ChevronDown size={30} strokeWidth={2.25} aria-hidden />
        </button>
      ) : null}

      {/* "Who do you want to write to?" — the same one-button-per-spouse WhatsApp
          dialog as the site's contacts. A native <dialog>, so it sits above the
          letter's fixed layers. */}
      <CoupleContactDialog mode={contactOpen ? 'whatsapp' : null} onClose={() => setContactOpen(false)} />
      <DeclineDialog
        open={declineOpen}
        plural={plural}
        busy={declining}
        error={declineError}
        onConfirm={() => void handleDecline()}
        onClose={() => {
          setDeclineOpen(false);
          setDeclineError(null);
        }}
      />
    </div>
  );
}
