import { useEffect, useRef } from 'react';

import { distanceToTarget, stepParticle, type SteeringParticle, type Vector2D } from '@/components/EnvelopeInvite/particleSteering';
import { wrapText } from '@/components/EnvelopeInvite/particleTextWrap';

import './styles/ParticleLine.scss';

type ParticleLineProps = {
  text: string;
  /** Milliseconds after `active` becomes true that this line's particles
   * should start forming — same clock TypedText's `startMs` uses (both
   * come from the same buildTypeSchedule(letterLines) call). */
  startMs: number;
  /** Mirrors EnvelopeInvite's `isOpen` — the effect below does nothing
   * (and cleans up) while this is false. */
  active: boolean;
};

// Hard cap on simultaneous particles regardless of how much text/area a
// line covers — keeps the physics loop cheap on lower-end phones even for
// the long intro paragraph. See spec "Rischi noti".
const MAX_PARTICLES = 400;
// Sample every 6th pixel row-group when rasterizing text to targets — same
// downsampling factor as docs/deferred/particle-text-effect.md, dense
// enough to read as the word, sparse enough to stay under MAX_PARTICLES
// for most lines before the additional MAX_PARTICLES cut below even
// kicks in.
const PIXEL_STEP = 6;
// A line's formation is force-settled at this point even if particles
// haven't geometrically converged — caps worst-case time-on-screen for a
// dense line so the sequence never visibly stalls.
const SETTLE_MAX_MS = 900;
// Below this average remaining distance (px), a line counts as settled —
// "close enough" rather than waiting for exact zero, which particle
// steering approaches asymptotically and would never truly reach.
const SETTLE_DISTANCE_PX = 2;
const FADE_OUT_MS = 220;

/** Mirrors the CSS `text-transform` values buildTargets() reads from
 * `getComputedStyle`, so the rasterized particle text matches what the
 * real DOM text underneath ends up rendering (e.g. the personal-greeting
 * line's `text-transform: uppercase`). */
function applyTextTransform(value: string, transform: string): string {
  switch (transform) {
    case 'uppercase':
      return value.toUpperCase();
    case 'lowercase':
      return value.toLowerCase();
    case 'capitalize':
      return value.replace(/\b\w/g, (char) => char.toUpperCase());
    default:
      return value;
  }
}

/**
 * Canvas overlay that forms `text` out of particles once `active` and this
 * line's own `startMs` has elapsed, then fades out to reveal the real DOM
 * text already sitting underneath (see EnvelopeInvite.tsx — this is layered
 * on top of a <TypedText>, never a replacement for it: screen readers,
 * selection and zoom all still see the real text regardless of what this
 * canvas is doing).
 *
 * See docs/superpowers/specs/2026-08-31-particle-letter-text-design.md.
 */
export function ParticleLine({ text, startMs, active }: ParticleLineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container || !active) {
      return undefined;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return undefined;
    }

    let width = 0;
    let height = 0;
    let rafId = 0;

    function resize() {
      const rect = container!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const computedStyle = getComputedStyle(container);
    const color = computedStyle.color;
    const font = `${computedStyle.fontStyle} ${computedStyle.fontWeight} ${computedStyle.fontSize} ${computedStyle.fontFamily}`;
    const lineHeightPx = parseFloat(computedStyle.lineHeight) || parseFloat(computedStyle.fontSize) * 1.4;
    const cssTextAlign = computedStyle.textAlign;
    const canvasTextAlign: CanvasTextAlign = cssTextAlign === 'right' ? 'right' : cssTextAlign === 'left' || cssTextAlign === 'start' ? 'left' : 'center';

    function buildTargets(): Vector2D[] {
      ctx!.font = font;
      // CanvasRenderingContext2D.letterSpacing is a newer API — unsupported
      // browsers simply ignore the assignment, which just means the
      // particle text is a bit tighter than the real DOM text during
      // formation (cosmetic only, no crash).
      ctx!.letterSpacing = computedStyle.letterSpacing;

      // Match what the real DOM does to this text before it's measured or
      // rasterized — otherwise particles form different characters/shape
      // than what's underneath (e.g. the personal-greeting line's
      // text-transform: uppercase) and jump-cut on fade-out.
      const transformedText = applyTextTransform(text, computedStyle.textTransform);
      const measure = (line: string) => ctx!.measureText(line).width;
      // `white-space: pre-line` (the date/venue line) renders each `\n` as
      // a real line break in the DOM — wrapText alone would collapse `\n`
      // into ordinary whitespace and regroup words into a different line
      // shape. Split on the real breaks first, then word-wrap each segment
      // independently, so the canvas's line structure matches the DOM's.
      const lines = computedStyle.whiteSpace.startsWith('pre')
        ? transformedText.split('\n').flatMap((segment) => wrapText(segment, width, measure))
        : wrapText(transformedText, width, measure);

      const offscreen = document.createElement('canvas');
      offscreen.width = canvas!.width;
      offscreen.height = canvas!.height;
      const offCtx = offscreen.getContext('2d')!;
      offCtx.setTransform(ctx!.getTransform());
      offCtx.font = font;
      offCtx.letterSpacing = computedStyle.letterSpacing;
      offCtx.fillStyle = '#fff';
      offCtx.textAlign = canvasTextAlign;
      offCtx.textBaseline = 'middle';

      const totalHeight = lines.length * lineHeightPx;
      const startY = height / 2 - totalHeight / 2 + lineHeightPx / 2;
      const x = canvasTextAlign === 'center' ? width / 2 : canvasTextAlign === 'right' ? width : 0;

      lines.forEach((line, index) => {
        offCtx.fillText(line, x, startY + index * lineHeightPx);
      });

      const dpr = window.devicePixelRatio || 1;
      const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
      const pixels = imageData.data;
      const points: Vector2D[] = [];
      for (let i = 0; i < pixels.length; i += PIXEL_STEP * 4) {
        if (pixels[i + 3] > 0) {
          const pixelIndex = i / 4;
          points.push({
            x: (pixelIndex % offscreen.width) / dpr,
            y: Math.floor(pixelIndex / offscreen.width) / dpr,
          });
        }
      }
      return points;
    }

    function spawnParticles(targets: Vector2D[]): SteeringParticle[] {
      const step = targets.length > MAX_PARTICLES ? Math.ceil(targets.length / MAX_PARTICLES) : 1;
      const sampled = targets.filter((_, index) => index % step === 0);
      const spawnRadius = Math.max(width, height) * 0.6;

      return sampled.map((target) => {
        const angle = Math.random() * Math.PI * 2;
        const maxSpeed = 4 + Math.random() * 4;
        return {
          pos: {
            x: width / 2 + Math.cos(angle) * spawnRadius,
            y: height / 2 + Math.sin(angle) * spawnRadius,
          },
          vel: { x: 0, y: 0 },
          acc: { x: 0, y: 0 },
          target,
          maxSpeed,
          maxForce: maxSpeed * 0.08,
        };
      });
    }

    function draw(particles: SteeringParticle[]) {
      ctx!.clearRect(0, 0, width, height);
      ctx!.fillStyle = color;
      for (const particle of particles) {
        ctx!.fillRect(particle.pos.x, particle.pos.y, 2, 2);
      }
    }

    const timeoutId = window.setTimeout(() => {
      canvas!.style.opacity = '1';
      const particles = spawnParticles(buildTargets());
      const formationStart = performance.now();
      let settledAt = 0;
      let lastFrame = 0;

      function frame(now: number) {
        // Frame-rate-independent physics: stepParticle's motion was written
        // as "1 unit per call", so scale each call by how many nominal 60fps
        // frames' worth of wall-clock time actually elapsed since the last
        // frame — same idea as HeroParticleField.tsx's deltaSeconds, adapted
        // to this file's per-frame (not per-second) unit. Without this, a
        // slower device gets fewer, unscaled steps and ends up further from
        // its targets when SETTLE_MAX_MS fires. See particleSteering.ts.
        const deltaFrames = lastFrame === 0 ? 1 : Math.min(((now - lastFrame) / 1000) * 60, 4);
        lastFrame = now;

        let totalDistance = 0;
        for (const particle of particles) {
          stepParticle(particle, deltaFrames);
          totalDistance += distanceToTarget(particle);
        }
        draw(particles);

        const avgDistance = particles.length > 0 ? totalDistance / particles.length : 0;
        const elapsed = now - formationStart;
        const settled = avgDistance < SETTLE_DISTANCE_PX || elapsed >= SETTLE_MAX_MS;

        if (settled) {
          if (settledAt === 0) {
            settledAt = now;
            canvas!.style.opacity = '0';
          }
          if (now - settledAt >= FADE_OUT_MS) {
            return; // stop the loop — canvas is transparent, real text underneath shows
          }
        }

        rafId = requestAnimationFrame(frame);
      }

      rafId = requestAnimationFrame(frame);
    }, startMs);

    return () => {
      window.clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [text, startMs, active]);

  return <canvas ref={canvasRef} className="particle-line" aria-hidden="true" />;
}
