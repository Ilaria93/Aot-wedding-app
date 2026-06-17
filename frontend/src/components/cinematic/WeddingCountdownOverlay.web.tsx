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

type WeddingCountdownOverlayProps = {
  opacity: number;
  visible: boolean;
};

function padCountdownUnit(value: number): string {
  return String(value).padStart(2, '0');
}

const overlayRootStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 5,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'clamp(16px, 4vw, 40px)',
  pointerEvents: 'none',
};

const parchmentStyle: CSSProperties = {
  width: 'min(100%, 640px)',
  margin: '0 auto',
  padding: 'clamp(24px, 5vw, 48px) clamp(20px, 4vw, 40px)',
  border: `1px solid ${aotTheme.bronze}`,
  borderRadius: 2,
  background:
    'linear-gradient(165deg, rgba(249, 248, 243, 0.98) 0%, rgba(237, 230, 214, 0.96) 48%, rgba(229, 220, 200, 0.98) 100%)',
  boxShadow:
    '0 24px 60px rgba(26, 33, 29, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.65), inset 0 -1px 0 rgba(123, 111, 96, 0.18)',
  color: aotTheme.textPrimary,
  textAlign: 'center',
};

const stampStyle: CSSProperties = {
  margin: 0,
  fontFamily: '"Courier New", Courier, monospace',
  fontSize: 'clamp(0.65rem, 1.8vw, 0.75rem)',
  fontWeight: 700,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: aotTheme.militaryGreenDark,
};

const coupleStyle: CSSProperties = {
  margin: '18px 0 10px',
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: 'clamp(1.75rem, 5.5vw, 2.85rem)',
  lineHeight: 1.15,
  fontWeight: 700,
  letterSpacing: '0.04em',
};

const fieldLabelStyle: CSSProperties = {
  margin: '0 0 6px',
  fontFamily: '"Courier New", Courier, monospace',
  fontSize: 'clamp(0.62rem, 1.6vw, 0.72rem)',
  fontWeight: 700,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: aotTheme.parchment,
};

const fieldValueStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: 'clamp(0.95rem, 2.6vw, 1.15rem)',
  lineHeight: 1.45,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

const locationStyle: CSSProperties = {
  ...fieldValueStyle,
  textTransform: 'none',
  letterSpacing: '0.03em',
  fontSize: 'clamp(0.9rem, 2.4vw, 1.05rem)',
  fontStyle: 'normal',
};

const dividerStyle: CSSProperties = {
  width: '72%',
  maxWidth: 360,
  height: 1,
  margin: '22px auto',
  border: 0,
  background:
    'linear-gradient(90deg, transparent, rgba(184, 138, 82, 0.75), transparent)',
};

const countdownGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(56px, 1fr))',
  gap: 'clamp(8px, 2vw, 16px)',
  margin: 0,
  padding: 0,
  listStyle: 'none',
};

const countdownUnitStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
};

const countdownValueStyle: CSSProperties = {
  fontFamily: '"Courier New", Courier, monospace',
  fontSize: 'clamp(1.35rem, 4.5vw, 2.2rem)',
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 1,
  color: aotTheme.militaryGreenDark,
};

const countdownLabelStyle: CSSProperties = {
  fontFamily: '"Courier New", Courier, monospace',
  fontSize: 'clamp(0.62rem, 1.6vw, 0.72rem)',
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: aotTheme.parchment,
};

/**
 * Parchment-style HTML overlay with ceremony date, venue and live countdown (web only).
 */
export function WeddingCountdownOverlay({ opacity, visible }: WeddingCountdownOverlayProps) {
  const { locale, t } = useI18n();
  const countdown = useWeddingCountdown();

  if (!visible) {
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

  const rootStyle: CSSProperties = {
    ...overlayRootStyle,
    opacity,
    transition: 'opacity 220ms ease-out',
  };

  return createElement(
    'section',
    {
      'aria-label': t('landing.cinematic.countdownOverlayLabel'),
      'aria-hidden': opacity < 0.05,
      style: rootStyle,
    },
    createElement(
      'article',
      { style: parchmentStyle },
      createElement('p', { style: stampStyle }, WEDDING_OPERATION_NAME),
      createElement('h2', { style: coupleStyle }, WEDDING_COUPLE_NAMES),
      createElement(
        'div',
        { style: { marginBottom: 18 } },
        createElement('p', { style: fieldLabelStyle }, t('landing.cinematic.dateLabel')),
        createElement(
          'time',
          { dateTime: ceremonyIso, style: fieldValueStyle },
          ceremonyDate,
        ),
      ),
      createElement(
        'div',
        { style: { marginBottom: 4 } },
        createElement('p', { style: fieldLabelStyle }, t('landing.cinematic.locationLabel')),
        createElement('address', { style: locationStyle }, venueLine),
      ),
      createElement('hr', { style: dividerStyle }),
      createElement(
        'div',
        {
          role: 'timer',
          'aria-live': 'polite',
          'aria-atomic': true,
          'aria-label': liveSummary,
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
              { key: unit.label, style: countdownUnitStyle },
              createElement(
                'span',
                { style: countdownValueStyle, 'aria-hidden': true },
                padCountdownUnit(unit.value),
              ),
              createElement('span', { style: countdownLabelStyle }, unit.label),
            ),
          ),
        ),
      ),
      createElement(
        'p',
        {
          style: {
            ...stampStyle,
            marginTop: 20,
            color: aotTheme.bronze,
            letterSpacing: '0.2em',
          },
        },
        t('landing.cinematic.documentStamp'),
      ),
    ),
  );
}
