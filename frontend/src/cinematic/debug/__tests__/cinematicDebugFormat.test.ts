import { describe, expect, it } from 'vitest';

import { formatDebugNumber, formatDebugVector3 } from '@/cinematic/debug/cinematicDebugFormat';

describe('cinematicDebugFormat', () => {
  it('formats scalar values with fixed precision', () => {
    expect(formatDebugNumber(0.123456, 4)).toBe('0.1235');
  });

  it('formats 3D tuples as comma-separated values', () => {
    expect(formatDebugVector3([1, 2.5, -3.125], 2)).toBe('1.00, 2.50, -3.13');
  });
});
