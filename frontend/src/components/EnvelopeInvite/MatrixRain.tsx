import { useEffect, useRef } from 'react';

import './styles/MatrixRain.scss';

type MatrixRainProps = {
  /** Mounts and starts the falling-characters animation. */
  active: boolean;
  /** Total time the rain runs before firing onComplete. */
  durationMs: number;
  /** Fires once, when the rain has run its course (or immediately, under
   * reduced motion). Read through a ref so a fresh inline function every
   * render doesn't tear down and restart the effect. */
  onComplete: () => void;
};

// Italian letters + digits, not the reference implementation's katakana —
// the rest of this transition (name, countdown, letter) is all Italian
// text, so the rain reads as the same language rather than a generic
// "Matrix" lift.
const LATIN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÀÈÉÌÒÙ';
const DIGITS = '0123456789';
const GLYPHS = LATIN + DIGITS;
const FONT_SIZE = 18;
const RAIN_COLOR = '#4ade80';
// setInterval, not requestAnimationFrame: rAF is suspended while the tab is
// backgrounded, which would leave this one-shot transition stuck mid-rain
// (and the letter never opening) if the OS backgrounds the tab partway
// through — matches the reference implementation's own choice, which uses
// setInterval for the same reason.
const TICK_MS = 30;

/**
 * Full-screen canvas "Matrix rain" transition between the video title card
 * and the letter opening — columns of glyphs fall for `durationMs`, then
 * hand off via onComplete. Canvas over DOM spans: hundreds of independently
 * falling characters would be a lot of React-managed nodes for a one-shot
 * decorative transition.
 */
export function MatrixRain({ active, durationMs, onComplete }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onCompleteRef.current();
      return undefined;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      return undefined;
    }

    const dpr = window.devicePixelRatio || 1;
    let columns = 0;
    let drops: number[] = [];

    const setup = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      columns = Math.ceil(window.innerWidth / FONT_SIZE);
      drops = new Array(columns).fill(0).map(() => Math.random() * -40);
    };
    setup();
    window.addEventListener('resize', setup);

    const start = Date.now();

    function tick() {
      ctx!.fillStyle = 'rgba(10, 15, 10, 0.16)';
      ctx!.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx!.fillStyle = RAIN_COLOR;
      ctx!.font = `${FONT_SIZE}px ui-monospace, 'SF Mono', Menlo, Consolas, monospace`;
      drops.forEach((y, index) => {
        const glyph = GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
        ctx!.fillText(glyph, index * FONT_SIZE, y * FONT_SIZE);
        if (y * FONT_SIZE > window.innerHeight && Math.random() > 0.975) {
          drops[index] = 0;
        } else {
          drops[index] = y + 1;
        }
      });

      if (Date.now() - start >= durationMs) {
        clearInterval(intervalId);
        onCompleteRef.current();
      }
    }
    const intervalId = setInterval(tick, TICK_MS);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resize', setup);
    };
  }, [active, durationMs]);

  if (!active) {
    return null;
  }

  return <canvas ref={canvasRef} className="matrix-rain" aria-hidden="true" />;
}
