import { useEffect, useMemo, useRef } from 'react';

import './styles/DecryptText.scss';

type DecryptTextProps = {
  text: string;
  /** Starts the one-shot reveal on the false→true transition. */
  active: boolean;
};

const GLYPHS = '#%&@$?!*+=/{}[]<>~^';
const SPEED_MS = 35;
const CYCLE_SPREAD_MS = 25;
const STAGGER_MS = 35;
const JITTER_MS = 40;

type CharItem = { key: number; ch: string };

function randomGlyph() {
  return GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
}

/**
 * Per-character "decrypt" reveal: every glyph cycles through a random
 * symbol, then locks to its real character in a ragged left-to-right sweep
 * (stagger + jitter per character) with a brief accent flash.
 *
 * Ported from a Motiq reference component (Tailwind/Next — not this stack)
 * down to what a one-shot title reveal actually needs: no loop, no hover
 * retrigger, no visibility-pause. This only ever plays once, inside the
 * small, always-in-view envelope video stage — see EnvelopeInvite.tsx.
 */
export function DecryptText({ text, active }: DecryptTextProps) {
  const charRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const rafRef = useRef(0);
  const playedRef = useRef(false);

  // Words keep their letters grouped so the line only wraps between words,
  // and the space between them stays a real space (never scrambled).
  const words = useMemo(() => {
    let i = 0;
    return text.split(' ').map((word) =>
      Array.from(word).map((ch): CharItem => {
        const item = { key: i, ch };
        i += 1;
        return item;
      }),
    );
  }, [text]);

  useEffect(() => {
    if (!active || playedRef.current) {
      return undefined;
    }

    const cells = charRefs.current.filter((el): el is HTMLSpanElement => el !== null);
    if (cells.length === 0) {
      return undefined;
    }
    playedRef.current = true;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      for (const el of cells) {
        el.textContent = el.dataset.char ?? '';
        el.dataset.state = 'locked';
      }
      return undefined;
    }

    const lockAt = cells.map((_, index) => STAGGER_MS * index + (Math.random() * 2 - 1) * JITTER_MS);
    const nextCycleAt = new Array(cells.length).fill(0);
    const locked = new Array(cells.length).fill(false);
    cells.forEach((el) => {
      el.dataset.state = 'scramble';
      el.textContent = randomGlyph();
    });

    const start = performance.now();

    function frame(now: number) {
      const elapsed = now - start;
      let remaining = 0;
      cells.forEach((el, index) => {
        if (locked[index]) {
          return;
        }
        if (elapsed >= lockAt[index]) {
          el.textContent = el.dataset.char ?? '';
          el.dataset.state = 'locked';
          locked[index] = true;
          return;
        }
        remaining += 1;
        if (elapsed >= nextCycleAt[index]) {
          el.textContent = randomGlyph();
          nextCycleAt[index] = elapsed + SPEED_MS + Math.random() * CYCLE_SPREAD_MS;
        }
      });
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(frame);
      }
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  let index = -1;

  return (
    <span className="decrypt-text">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, wordIndex) => (
          <span key={wordIndex} className="decrypt-text__word">
            {word.map((item) => {
              index += 1;
              const at = index;
              return (
                <span
                  key={item.key}
                  className="decrypt-text__char"
                  data-char={item.ch}
                  data-state="idle"
                  ref={(el) => {
                    charRefs.current[at] = el;
                  }}>
                  {item.ch}
                </span>
              );
            })}
            {wordIndex < words.length - 1 ? ' ' : null}
          </span>
        ))}
      </span>
    </span>
  );
}
