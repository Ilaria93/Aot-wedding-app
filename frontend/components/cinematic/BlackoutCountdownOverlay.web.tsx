import { createElement, type CSSProperties } from 'react';

import { aotTheme } from '@/constants/aotTheme';
import {
  formatVenueLine,
  formatWeddingTrailerDate,
  getWeddingTimestampMs,
  WEDDING_COUPLE_NAMES,
  WEDDING_OPERATION_NAME,
} from '@/constants/weddingEvent';
import { useI18n } from '@/contexts/I18nContext';
import { useWeddingCountdown } from '@/hooks/useWeddingCountdown';

type BlackoutCountdownOverlayProps = {
  visible: boolean;
  blackoutOpacity: number;
  metaOpacity: number;
  countdownOpacity: number;
};

function padCountdownUnit(value: number): string {
  return String(value).padStart(2, '0');
}

const rootStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 5,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'clamp(16px, 4vw, 40px)',
  pointerEvents: 'none',
};

const stackStyle: CSSProperties = {
  width: 'min(100%, 720px)',
  margin: '0 auto',
  textAlign: 'center',
  color: 'rgba(249, 248, 243, 0.92)',
};

const stampStyle: CSSProperties = {
  margin: 0,
  fontFamily: '"Courier New", Courier, monospace',
  fontSize: 'clamp(0.62rem, 1.6vw, 0.72rem)',
  fontWeight: 700,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: aotTheme.bronze,
};

const coupleStyle: CSSProperties = {
  margin: '20px 0 12px',
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: 'clamp(1.6rem, 5vw, 2.6rem)',
  lineHeight: 1.1,
  fontWeight: 700,
  letterSpacing: '0.04em',
};

const fieldLabelStyle: CSSProperties = {
  margin: '0 0 6px',
  fontFamily: '"Courier New", Courier, monospace',
  fontSize: 'clamp(0.62rem, 1.5vw, 0.72rem)',
  fontWeight: 700,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'rgba(184, 138, 82, 0.88)',
};

const fieldValueStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: 'clamp(0.95rem, 2.4vw, 1.15rem)',
  lineHeight: 1.45,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const countdownGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(56px, 1fr))',
  gap: 'clamp(8px, 2vw, 16px)',
  margin: '28px 0 0',
  padding: 0,
  listStyle: 'none',
};

const countdownValueStyle: CSSProperties = {
  fontFamily: '"Courier New", Courier, monospace',
  fontSize: 'clamp(1.5rem, 5vw, 2.6rem)',
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 1,
  color: aotTheme.bronze,
  textShadow: '0 0 24px rgba(184, 138, 82, 0.45), 0 0 48px rgba(184, 138, 82, 0.18)',
};

const countdownLabelStyle: CSSProperties = {
  fontFamily: '"Courier New", Courier, monospace',
  fontSize: 'clamp(0.62rem, 1.5vw, 0.72rem)',
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(184, 138, 82, 0.72)',
};

/**
 * Fullscreen blackout finale with ceremony meta and live countdown (web only).
 */
export function BlackoutCountdownOverlay({
  visible,
  blackoutOpacity,
  metaOpacity,
  countdownOpacity,
}: BlackoutCountdownOverlayProps) {
  const { locale, t } = useI18n();
  const countdown = useWeddingCountdown();

  if (!visible || blackoutOpacity <= 0) {
    return null;
  }

  const ceremonyDate = formatWeddingTrailerDate(locale);
  const venueLine = formatVenueLine();
  const ceremonyIso = new Date(getWeddingTimestampMs()).toISOString();
  const liveSummary = t('landing.cinematic.countdownLiveSummary', {
    days: padCountdownUnit(countdown.days),
    hours: padCountdownUnit(countdown.hours),
    minutes: padCountdownUnit(countdown.minutes),
    seconds: padCountdownUnit(countdown.seconds),
  });

  return createElement(
    'section',
    {
      'aria-label': t('landing.cinematic.countdownOverlayLabel'),
      style: {
        ...rootStyle,
        backgroundColor: `rgba(0, 0, 0, ${blackoutOpacity})`,
      },
    },
    createElement(
      'article',
      {
        style: {
          ...stackStyle,
          opacity: Math.max(metaOpacity, countdownOpacity),
        },
      },
      metaOpacity > 0
        ? createElement('p', { style: { ...stampStyle, opacity: metaOpacity } }, WEDDING_OPERATION_NAME)
        : null,
      metaOpacity > 0
        ? createElement(
            'h2',
            { style: { ...coupleStyle, opacity: metaOpacity } },
            WEDDING_COUPLE_NAMES,
          )
        : null,
      metaOpacity > 0
        ? createElement(
            'div',
            { style: { marginBottom: 18, opacity: metaOpacity } },
            createElement('p', { style: fieldLabelStyle }, t('landing.cinematic.dateLabel')),
            createElement('time', { dateTime: ceremonyIso, style: fieldValueStyle }, ceremonyDate),
          )
        : null,
      metaOpacity > 0
        ? createElement(
            'div',
            { style: { marginBottom: 4, opacity: metaOpacity } },
            createElement('p', { style: fieldLabelStyle }, t('landing.cinematic.locationLabel')),
            createElement('address', { style: { ...fieldValueStyle, textTransform: 'none' } }, venueLine),
          )
        : null,
      countdownOpacity > 0
        ? createElement(
            'div',
            {
              role: 'timer',
              'aria-live': 'polite',
              'aria-atomic': true,
              'aria-label': liveSummary,
              style: { opacity: countdownOpacity },
            },
            createElement(
              'ol',
              { style: countdownGridStyle },
              [
                { value: countdown.days, label: t('landing.cinematic.days') },
                { value: countdown.hours, label: t('landing.cinematic.hours') },
                { value: countdown.minutes, label: t('landing.cinematic.minutes') },
                { value: countdown.seconds, label: t('landing.cinematic.seconds') },
              ].map((unit) =>
                createElement(
                  'li',
                  {
                    key: unit.label,
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                    },
                  },
                  createElement(
                    'span',
                    { style: countdownValueStyle, 'aria-hidden': true },
                    padCountdownUnit(unit.value),
                  ),
                  createElement('span', { style: countdownLabelStyle }, unit.label),
                ),
              ),
            ),
          )
        : null,
    ),
  );
}
