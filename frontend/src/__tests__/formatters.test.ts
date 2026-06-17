import { describe, expect, it } from 'vitest';

import { formatBytes, formatDateByLocale } from '@/types/formatters';

describe('formatters', () => {
  it('formats dates by locale', () => {
    const formatted = formatDateByLocale('2027-05-31T14:30:00.000Z', 'it', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    expect(formatted).toMatch(/2027/);
    expect(formatted).toMatch(/maggio|May|mai/i);
  });

  it('returns null for empty date values', () => {
    expect(formatDateByLocale(null, 'en')).toBeNull();
    expect(formatDateByLocale(undefined, 'en')).toBeNull();
  });

  it('formats byte sizes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});
