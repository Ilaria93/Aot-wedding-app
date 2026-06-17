import { createElement, type CSSProperties } from 'react';

import { aotTheme } from '@/constants/aotTheme';
import type { SceneCaptionVisuals } from '@/utils/sceneCaptionVisuals';

type CinematicSceneCaptionsProps = {
  visuals: SceneCaptionVisuals;
  translate: (key: string) => string;
};

const rootStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 3,
  pointerEvents: 'none',
};

const columnBaseStyle: CSSProperties = {
  position: 'absolute',
  top: '18%',
  width: 'min(34vw, 280px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const leftColumnStyle: CSSProperties = {
  ...columnBaseStyle,
  left: 'clamp(20px, 4vw, 48px)',
  alignItems: 'flex-start',
  textAlign: 'left',
};

const rightColumnStyle: CSSProperties = {
  ...columnBaseStyle,
  right: 'clamp(20px, 4vw, 48px)',
  alignItems: 'flex-end',
  textAlign: 'right',
};

const eyebrowStyle: CSSProperties = {
  margin: 0,
  fontFamily: '"Courier New", Courier, monospace',
  fontSize: 'clamp(0.62rem, 1.5vw, 0.72rem)',
  fontWeight: 700,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: aotTheme.bronze,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: 'clamp(1.2rem, 3.2vw, 1.85rem)',
  lineHeight: 1.2,
  fontWeight: 700,
  color: 'rgba(249, 248, 243, 0.94)',
  textShadow: '0 0 18px rgba(184, 138, 82, 0.28)',
};

const impactStyle: CSSProperties = {
  position: 'absolute',
  left: '50%',
  bottom: '18%',
  transform: 'translateX(-50%)',
  margin: 0,
  maxWidth: 'min(90vw, 520px)',
  textAlign: 'center',
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: 'clamp(1rem, 2.8vw, 1.45rem)',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'rgba(249, 248, 243, 0.96)',
  textShadow: '0 0 28px rgba(255, 255, 255, 0.45)',
};

function renderSide(
  opacity: number,
  eyebrowKey: string | null,
  titleKey: string | null,
  columnStyle: CSSProperties,
  translate: (key: string) => string,
) {
  if (!eyebrowKey || !titleKey || opacity <= 0) {
    return null;
  }

  return createElement(
    'div',
    {
      style: {
        ...columnStyle,
        opacity,
      },
    },
    createElement('p', { style: eyebrowStyle }, translate(eyebrowKey)),
    createElement('p', { style: titleStyle }, translate(titleKey)),
  );
}

/**
 * Scroll-driven left/right narrative captions for the cinematic hero (web only).
 */
export function CinematicSceneCaptions({ visuals, translate }: CinematicSceneCaptionsProps) {
  const {
    opacity,
    leftEyebrowKey,
    leftTitleKey,
    rightEyebrowKey,
    rightTitleKey,
    impactTaglineKey,
    impactTaglineOpacity,
  } = visuals;

  if (
    opacity <= 0 &&
    impactTaglineOpacity <= 0
  ) {
    return null;
  }

  return createElement(
    'div',
    { 'aria-hidden': true, style: rootStyle },
    renderSide(opacity, leftEyebrowKey, leftTitleKey, leftColumnStyle, translate),
    renderSide(opacity, rightEyebrowKey, rightTitleKey, rightColumnStyle, translate),
    impactTaglineKey && impactTaglineOpacity > 0
      ? createElement(
          'p',
          {
            style: {
              ...impactStyle,
              opacity: impactTaglineOpacity,
            },
          },
          translate(impactTaglineKey),
        )
      : null,
  );
}
