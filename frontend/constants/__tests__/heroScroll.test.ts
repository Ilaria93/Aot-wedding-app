import {
  HERO_NAVBAR_FADE_END_PROGRESS,
  HERO_NAVBAR_REAPPEAR_START_PROGRESS,
  HERO_SCROLL_DISTANCE_FALLBACK,
  HERO_SCROLL_VIEWPORT_RATIO,
  HERO_VISIBLE_HEIGHT_FALLBACK,
  HERO_VISIBLE_VIEWPORT_RATIO,
  resolveHeroNavbarIntroOpacity,
  resolveHeroNavbarOpacity,
  resolveHeroNavbarOutroOpacity,
  resolveHeroScrollDistance,
  resolveHeroVisibleHeight,
} from '@/constants/heroScroll';

describe('heroScroll', () => {
  const originalWindow = global.window;

  afterEach(() => {
    if (originalWindow) {
      global.window = originalWindow;
    } else {
      // @ts-expect-error test cleanup
      delete global.window;
    }
  });

  it('uses override values when provided', () => {
    expect(resolveHeroScrollDistance(900)).toBe(900);
    expect(resolveHeroVisibleHeight(640)).toBe(640);
  });

  it('derives distances from viewport height when window is available', () => {
    Object.defineProperty(global, 'window', {
      configurable: true,
      value: { innerHeight: 1000 },
    });

    expect(resolveHeroScrollDistance()).toBe(Math.round(1000 * HERO_SCROLL_VIEWPORT_RATIO));
    expect(resolveHeroVisibleHeight()).toBe(Math.round(1000 * HERO_VISIBLE_VIEWPORT_RATIO));
  });

  it('falls back when window is unavailable', () => {
    // @ts-expect-error test cleanup
    delete global.window;

    expect(resolveHeroScrollDistance()).toBe(HERO_SCROLL_DISTANCE_FALLBACK);
    expect(resolveHeroVisibleHeight()).toBe(HERO_VISIBLE_HEIGHT_FALLBACK);
  });

  it('fades the hero navbar intro out and outro back in near the end', () => {
    expect(resolveHeroNavbarIntroOpacity(0)).toBe(1);
    expect(resolveHeroNavbarIntroOpacity(HERO_NAVBAR_FADE_END_PROGRESS / 2)).toBe(0.5);
    expect(resolveHeroNavbarIntroOpacity(HERO_NAVBAR_FADE_END_PROGRESS)).toBe(0);
    expect(resolveHeroNavbarIntroOpacity(0.5)).toBe(0);

    expect(resolveHeroNavbarOutroOpacity(0.5)).toBe(0);
    expect(resolveHeroNavbarOutroOpacity(HERO_NAVBAR_REAPPEAR_START_PROGRESS)).toBe(0);
    expect(resolveHeroNavbarOutroOpacity(0.96)).toBeCloseTo(0.5);
    expect(resolveHeroNavbarOutroOpacity(1)).toBe(1);

    expect(resolveHeroNavbarOpacity(0.5)).toBe(0);
    expect(resolveHeroNavbarOpacity(1)).toBe(1);
  });
});
