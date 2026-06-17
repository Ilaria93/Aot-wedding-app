import {
  COUNTDOWN_BLACKOUT_HOLD_END_AT,
  COUNTDOWN_FLASH_END_AT,
  COUNTDOWN_FLASH_PEAK_AT,
  COUNTDOWN_META_FADE_END_AT,
  COUNTDOWN_META_FADE_START_AT,
  COUNTDOWN_TIMER_FADE_END_AT,
  COUNTDOWN_TIMER_FADE_START_AT,
} from '@/constants/countdownTransition';

export type CountdownTransitionVisuals = {
  flashOpacity: number;
  blackoutOpacity: number;
  metaOpacity: number;
  countdownOpacity: number;
  showOverlay: boolean;
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(value: number): number {
  const t = clamp01(value);
  return 1 - (1 - t) ** 3;
}

function resolveFadeIn(
  progress: number,
  fadeStart: number,
  fadeEnd: number,
): number {
  if (progress < fadeStart) {
    return 0;
  }

  if (progress >= fadeEnd) {
    return 1;
  }

  const span = fadeEnd - fadeStart;
  if (span <= 0) {
    return 1;
  }

  return easeOutCubic((progress - fadeStart) / span);
}

/**
 * Maps countdown-transition local progress to blackout, meta and timer opacities.
 */
export function resolveCountdownTransitionVisuals(
  localProgress: number,
  options: { reduceMotion?: boolean } = {},
): CountdownTransitionVisuals {
  const progress = clamp01(localProgress);

  if (options.reduceMotion) {
    const metaOpacity = resolveFadeIn(progress, COUNTDOWN_META_FADE_START_AT, COUNTDOWN_META_FADE_END_AT);
    const countdownOpacity = resolveFadeIn(
      progress,
      COUNTDOWN_TIMER_FADE_START_AT,
      COUNTDOWN_TIMER_FADE_END_AT,
    );

    return {
      flashOpacity: 0,
      blackoutOpacity: progress >= COUNTDOWN_FLASH_END_AT ? 1 : 0,
      metaOpacity,
      countdownOpacity,
      showOverlay: progress >= COUNTDOWN_META_FADE_START_AT,
    };
  }

  let flashOpacity = 0;

  if (progress <= COUNTDOWN_FLASH_PEAK_AT) {
    flashOpacity = easeOutCubic(progress / COUNTDOWN_FLASH_PEAK_AT);
  } else if (progress < COUNTDOWN_FLASH_END_AT) {
    const fadeSpan = COUNTDOWN_FLASH_END_AT - COUNTDOWN_FLASH_PEAK_AT;
    const fadeAmount = (progress - COUNTDOWN_FLASH_PEAK_AT) / fadeSpan;
    flashOpacity = 1 - easeOutCubic(fadeAmount);
  }

  const blackoutOpacity =
    progress >= COUNTDOWN_FLASH_END_AT
      ? easeOutCubic(
          Math.min(
            1,
            (progress - COUNTDOWN_FLASH_END_AT) /
              Math.max(COUNTDOWN_BLACKOUT_HOLD_END_AT - COUNTDOWN_FLASH_END_AT, 0.001),
          ),
        )
      : 0;

  const metaOpacity = resolveFadeIn(
    progress,
    COUNTDOWN_META_FADE_START_AT,
    COUNTDOWN_META_FADE_END_AT,
  );
  const countdownOpacity = resolveFadeIn(
    progress,
    COUNTDOWN_TIMER_FADE_START_AT,
    COUNTDOWN_TIMER_FADE_END_AT,
  );

  return {
    flashOpacity: clamp01(flashOpacity),
    blackoutOpacity: clamp01(Math.max(blackoutOpacity, metaOpacity > 0 ? 1 : 0, countdownOpacity > 0 ? 1 : 0)),
    metaOpacity: clamp01(metaOpacity),
    countdownOpacity: clamp01(countdownOpacity),
    showOverlay: metaOpacity > 0 || countdownOpacity > 0,
  };
}
