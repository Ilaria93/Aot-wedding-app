/** Normalized progress when the pinned hero releases into editorial content. */
export const HERO_SKIP_CONTENT_PROGRESS = 1;

/** Resolves the scroller pixel offset that completes the pinned hero scrub. */
export function resolveHeroSkipScrollTop(start: number, end: number): number {
  return start + (end - start) * HERO_SKIP_CONTENT_PROGRESS;
}
