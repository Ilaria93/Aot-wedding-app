import { describe, expect, it } from 'vitest';

import { buildBlackoutCountdownLines } from '@/cinematic/overlays/blackoutCountdownCopy';
import { formatCountdownVenueLine } from '@/constants/weddingEvent';

describe('buildBlackoutCountdownLines', () => {
  it('formats the two-line metallic countdown copy', () => {
    const lines = buildBlackoutCountdownLines(
      { days: 145, hours: 8, minutes: 32, seconds: 15 },
      {
        days: 'DAYS',
        hours: 'HOURS',
        minutes: 'MINUTES',
        seconds: 'SECONDS',
      },
    );

    expect(lines.firstLine).toBe('145 DAYS 08 HOURS');
    expect(lines.secondLine).toBe('32 MINUTES 15 SECONDS');
  });
});

describe('formatCountdownVenueLine', () => {
  it('returns the short city and venue subtitle', () => {
    expect(formatCountdownVenueLine()).toBe('Ravenna — Lido Adriano');
  });
});
