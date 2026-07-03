import { afterEach, describe, expect, it, vi } from 'vitest';

import { isCinematicHeroEnabled } from '@/constants/cinematicHero';

describe('isCinematicHeroEnabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns false when env flag is unset', () => {
    vi.stubEnv('VITE_CINEMATIC_HERO_ENABLED', undefined);
    expect(isCinematicHeroEnabled()).toBe(false);
  });

  it('returns true only when env flag is true', () => {
    vi.stubEnv('VITE_CINEMATIC_HERO_ENABLED', 'true');
    expect(isCinematicHeroEnabled()).toBe(true);
  });

  it('returns false for any other env value', () => {
    vi.stubEnv('VITE_CINEMATIC_HERO_ENABLED', 'false');
    expect(isCinematicHeroEnabled()).toBe(false);
  });
});
