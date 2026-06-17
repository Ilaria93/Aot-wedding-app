/** Visible hero height as a fraction of the viewport (web). */
export const HERO_VISIBLE_VIEWPORT_RATIO = 1;

/** Viewport heights scrolled while the cinematic hero stays pinned (scroll-scrub zone). */
export const HERO_SCROLL_VIEWPORT_RATIO = 2.75;

/** Fallback scroll distance when `window` is unavailable (SSR/tests). */
export const HERO_SCROLL_DISTANCE_FALLBACK = 2600;

/** Fallback visible hero height when `window` is unavailable (SSR/tests). */
export const HERO_VISIBLE_HEIGHT_FALLBACK = 900;

/** Progress at which the hero navbar overlay finishes fading out. */
export const HERO_NAVBAR_FADE_END_PROGRESS = 0.08;

/** Progress at which the hero navbar starts fading back in before editorial content. */
export const HERO_NAVBAR_REAPPEAR_START_PROGRESS = 0.92;

/** Navbar opacity at the start of the hero (fades out as scroll begins). */
export function resolveHeroNavbarIntroOpacity(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress));
  if (clamped >= HERO_NAVBAR_FADE_END_PROGRESS) {
    return 0;
  }

  return 1 - clamped / HERO_NAVBAR_FADE_END_PROGRESS;
}

/** Navbar opacity at the end of the hero (fades in before editorial content). */
export function resolveHeroNavbarOutroOpacity(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress));
  if (clamped < HERO_NAVBAR_REAPPEAR_START_PROGRESS) {
    return 0;
  }

  const span = 1 - HERO_NAVBAR_REAPPEAR_START_PROGRESS;
  return span > 0 ? (clamped - HERO_NAVBAR_REAPPEAR_START_PROGRESS) / span : 1;
}

/** Combined intro/outro opacity — hidden during the middle of the hero scrub. */
export function resolveHeroNavbarOpacity(progress: number): number {
  return Math.max(resolveHeroNavbarIntroOpacity(progress), resolveHeroNavbarOutroOpacity(progress));
}

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

/** Resolves the visible hero height in pixels for the current viewport. */
export function resolveHeroVisibleHeight(override?: number): number {
  if (typeof override === 'number') {
    return override;
  }

  if (typeof window !== 'undefined') {
    return Math.round(window.innerHeight * HERO_VISIBLE_VIEWPORT_RATIO);
  }

  return HERO_VISIBLE_HEIGHT_FALLBACK;
}
