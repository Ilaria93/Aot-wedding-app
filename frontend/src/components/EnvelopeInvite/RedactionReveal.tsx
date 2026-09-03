import { useEffect, useRef } from 'react';

import './styles/RedactionReveal.scss';

type RedactionRevealProps = {
  text: string;
  /** Starts the one-shot reveal on the false→true transition. */
  active: boolean;
  /** Fires once, when the bar has finished sliding away (or immediately,
   * under reduced motion). Read through a ref so a fresh inline function
   * every render doesn't tear down and restart the effect. */
  onComplete?: () => void;
};

// Matches the CSS transition's own duration (.redaction-reveal__bar in
// RedactionReveal.scss) — kept in sync manually.
const BAR_SLIDE_MS = 550;

/**
 * A solid bar covers the text, then slides away to reveal it — the whole
 * line at once, not per-character. Plain text underneath (no scramble, no
 * per-character split), so multi-line content (the date/venue block, with
 * its own \n's) just works under white-space: pre-line like normal text.
 */
export function RedactionReveal({ text, active, onComplete }: RedactionRevealProps) {
  const playedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!active || playedRef.current) {
      return undefined;
    }
    playedRef.current = true;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onCompleteRef.current?.();
      return undefined;
    }

    const timeoutId = setTimeout(() => onCompleteRef.current?.(), BAR_SLIDE_MS);
    return () => clearTimeout(timeoutId);
  }, [active]);

  return (
    <span className="redaction-reveal">
      {text}
      <span className={`redaction-reveal__bar${active ? ' redaction-reveal__bar--active' : ''}`} aria-hidden="true" />
    </span>
  );
}
