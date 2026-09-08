import { describe, expect, it } from 'vitest';

import { buildTypeSchedule, computeTypeReveal } from '@/components/EnvelopeInvite/EnvelopeInvite';

describe('envelope typewriter schedule', () => {
  it('runs lines sequentially, never overlapping', () => {
    const schedule = buildTypeSchedule(['short', 'a much longer line of text', 'x']);

    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].startMs).toBeGreaterThanOrEqual(schedule[i - 1].endMs);
    }
  });

  it('clamps a very long line instead of letting it drag on', () => {
    const longLine = 'a'.repeat(500);
    const [{ startMs, endMs }] = buildTypeSchedule([longLine]);

    expect(endMs - startMs).toBeLessThanOrEqual(4200);
  });

  it('reveals nothing before a line starts, partial text mid-line, full text once done', () => {
    const schedule = buildTypeSchedule(['hello']);
    const [{ startMs, endMs }] = schedule;
    const mid = (startMs + endMs) / 2;

    expect(computeTypeReveal(schedule, 0, false).revealed).toEqual(['']);
    const midReveal = computeTypeReveal(schedule, mid, false);
    expect(midReveal.revealed[0].length).toBeGreaterThan(0);
    expect(midReveal.revealed[0].length).toBeLessThan('hello'.length);
    expect(midReveal.activeIndex).toBe(0);
    expect(computeTypeReveal(schedule, endMs, false).revealed).toEqual(['hello']);
  });

  it('forces every line to its full text once done, regardless of elapsed', () => {
    const schedule = buildTypeSchedule(['one', 'two']);
    expect(computeTypeReveal(schedule, 0, true).revealed).toEqual(['one', 'two']);
    expect(computeTypeReveal(schedule, 0, true).activeIndex).toBe(-1);
  });
});
