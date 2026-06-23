import { describe, expect, it } from 'vitest';

import { formatWeddingHeroDateLine } from '@/constants/weddingEvent';

describe('formatWeddingHeroDateLine', () => {
  it('formats the wedding date with roman numerals and uppercase month', () => {
    expect(formatWeddingHeroDateLine('it')).toBe('XXXI · MAGGIO · MMXXVII');
  });
});
