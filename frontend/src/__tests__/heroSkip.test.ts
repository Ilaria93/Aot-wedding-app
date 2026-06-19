import { describe, expect, it } from 'vitest';

import { resolveHeroSkipScrollTop } from '@/constants/heroSkip';

describe('heroSkip', () => {
  it('resolves the end of the pinned hero scroll range', () => {
    expect(resolveHeroSkipScrollTop(100, 6100)).toBe(6100);
  });
});
