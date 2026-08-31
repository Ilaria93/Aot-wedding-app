import { describe, expect, it } from 'vitest';

import { wrapText } from '@/components/EnvelopeInvite/particleTextWrap';

// A fake measurer: "width" is just character count, so expected wrapping
// is easy to reason about without any real font metrics.
const charWidth = (line: string) => line.length;

describe('wrapText', () => {
  it('returns an empty array for empty or whitespace-only text', () => {
    expect(wrapText('', 10, charWidth)).toEqual([]);
    expect(wrapText('   ', 10, charWidth)).toEqual([]);
  });

  it('keeps everything on one line when it fits', () => {
    expect(wrapText('hello world', 20, charWidth)).toEqual(['hello world']);
  });

  it('wraps onto a new line when the next word would overflow', () => {
    // "one two" is 7 chars (fits maxWidth 7), adding " three" would be 13 (overflows)
    expect(wrapText('one two three', 7, charWidth)).toEqual(['one two', 'three']);
  });

  it('never splits a single word even if it alone exceeds maxWidth', () => {
    expect(wrapText('supercalifragilistic short', 5, charWidth)).toEqual([
      'supercalifragilistic',
      'short',
    ]);
  });

  it('collapses repeated whitespace between words', () => {
    expect(wrapText('one    two', 20, charWidth)).toEqual(['one two']);
  });
});
