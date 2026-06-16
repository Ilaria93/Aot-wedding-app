/** Viewport heights scrolled while the cinematic hero stays pinned. */
export const HERO_SCROLL_VIEWPORT_RATIO = 2.5;

/** Fallback scroll distance when `window` is unavailable (SSR/tests). */
export const HERO_SCROLL_DISTANCE_FALLBACK = 2400;

/** Resolves pinned hero scroll distance in pixels for the current viewport. */
export function resolveHeroScrollDistance(override?: number): number {
  if (typeof override === 'number') {
    return override;
  }

  if (typeof window !== 'undefined') {
    return Math.round(window.innerHeight * HERO_SCROLL_VIEWPORT_RATIO);
  }

  return HERO_SCROLL_DISTANCE_FALLBACK;
}
