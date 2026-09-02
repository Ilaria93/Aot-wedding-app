import { useEffect, useMemo, useRef } from 'react';

import './styles/FallingText.scss';

type FallingTextProps = {
  text: string;
  /** Starts the one-shot reveal on the false→true transition. */
  active: boolean;
  /** Per-character delay increment (ms) — each character starts falling
   * this much later than the previous one. */
  stagger?: number;
  /** Fires once, when the last character has landed (or immediately, under
   * reduced motion). Read through a ref so a fresh inline function every
   * render doesn't tear down and restart the effect. */
  onComplete?: () => void;
};

const DEFAULT_STAGGER_MS = 28;
// Matches the CSS keyframes' own duration (falling-text-drop in
// FallingText.scss) — kept in sync manually, same convention as this
// component's timing constants elsewhere in EnvelopeInvite.
const DROP_DURATION_MS = 420;

type CharItem = { key: number; ch: string };

/**
 * Per-character "falling" reveal, echoing the matrix-rain transition that
 * precedes the letter: each character drops in from above and settles,
 * staggered left to right, instead of typing or scrambling in. Pure CSS
 * keyframes with a per-character animation-delay — no rAF/state loop, so
 * ~200 characters re-rendering every frame (the bug the old typewriter
 * reveal had) isn't a risk here.
 */
export function FallingText({ text, active, stagger = DEFAULT_STAGGER_MS, onComplete }: FallingTextProps) {
  const playedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Split on \n first and render each line as its own <br/>-separated
  // group — every character span below is display: inline-block (needed
  // for the translateY drop to apply), and a bare '\n' rendered inside one
  // of those doesn't trigger white-space: pre-line's line-break handling
  // the way it does in normal inline text, so it has to become a real
  // <br/> instead of just another animated character.
  // Words within a line keep their letters grouped so it only wraps
  // between words, and the space between them stays a real space (never
  // animated).
  const linesOfWords = useMemo(() => {
    let i = 0;
    return text.split('\n').map((line) =>
      line.split(' ').map((word) =>
        Array.from(word).map((ch): CharItem => {
          const item = { key: i, ch };
          i += 1;
          return item;
        }),
      ),
    );
  }, [text]);

  const charCount = useMemo(
    () => linesOfWords.reduce((sum, words) => sum + words.reduce((lineSum, word) => lineSum + word.length, 0), 0),
    [linesOfWords],
  );

  useEffect(() => {
    if (!active || playedRef.current) {
      return undefined;
    }
    playedRef.current = true;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onCompleteRef.current?.();
      return undefined;
    }

    const totalMs = charCount === 0 ? 0 : (charCount - 1) * stagger + DROP_DURATION_MS;
    const timeoutId = setTimeout(() => onCompleteRef.current?.(), totalMs);
    return () => clearTimeout(timeoutId);
  }, [active, charCount, stagger]);

  let index = -1;

  return (
    <span className={`falling-text${active ? ' falling-text--active' : ''}`}>
      {linesOfWords.map((words, lineIndex) => (
        <span key={lineIndex}>
          {lineIndex > 0 ? <br /> : null}
          {words.map((word, wordIndex) => (
            <span key={wordIndex} className="falling-text__word">
              {word.map((item) => {
                index += 1;
                return (
                  <span
                    key={item.key}
                    className="falling-text__char"
                    style={{ animationDelay: `${index * stagger}ms` }}>
                    {item.ch}
                  </span>
                );
              })}
              {wordIndex < words.length - 1 ? ' ' : null}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}
