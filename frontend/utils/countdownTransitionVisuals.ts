import {
  COUNTDOWN_FLASH_END_AT,
  COUNTDOWN_FLASH_PEAK_AT,
  COUNTDOWN_OVERLAY_FADE_END_AT,
  COUNTDOWN_OVERLAY_FADE_START_AT,
} from '@/constants/countdownTransition';

export type CountdownTransitionVisuals = {
  flashOpacity: number;
  overlayOpacity: number;
  showOverlay: boolean;
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(value: number): number {
  const t = clamp01(value);
  return 1 - (1 - t) ** 3;
}

/**
 * Maps countdown-transition local progress to white-flash and overlay opacities.
 */
export function resolveCountdownTransitionVisuals(
  localProgress: number,
  options: { reduceMotion?: boolean } = {},
): CountdownTransitionVisuals {
  const progress = clamp01(localProgress);

  if (options.reduceMotion) {
    const showOverlay = progress >= COUNTDOWN_OVERLAY_FADE_START_AT;
    return {
      flashOpacity: 0,
      overlayOpacity: showOverlay ? 1 : 0,
      showOverlay,
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

  let overlayOpacity = 0;
  if (progress >= COUNTDOWN_OVERLAY_FADE_START_AT) {
    const fadeSpan = COUNTDOWN_OVERLAY_FADE_END_AT - COUNTDOWN_OVERLAY_FADE_START_AT;
    const fadeAmount =
      fadeSpan <= 0
        ? 1
        : (progress - COUNTDOWN_OVERLAY_FADE_START_AT) / fadeSpan;
    overlayOpacity = easeOutCubic(fadeAmount);
  }

  return {
    flashOpacity: clamp01(flashOpacity),
    overlayOpacity: clamp01(overlayOpacity),
    showOverlay: overlayOpacity > 0,
  };
}
