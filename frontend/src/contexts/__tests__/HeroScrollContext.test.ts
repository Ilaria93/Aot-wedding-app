import { isHeroScrollActiveProgress } from '@/contexts/HeroScrollContext';

describe('isHeroScrollActiveProgress', () => {
  it('is active while the hero cinematic is pinned (including the opening frame)', () => {
    expect(isHeroScrollActiveProgress(0)).toBe(true);
    expect(isHeroScrollActiveProgress(0.5)).toBe(true);
    expect(isHeroScrollActiveProgress(0.99)).toBe(true);
  });

  it('is inactive once the scroll-scrub sequence completes', () => {
    expect(isHeroScrollActiveProgress(1)).toBe(false);
  });
});
