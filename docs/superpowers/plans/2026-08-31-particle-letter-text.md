# Particle Letter Text Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain per-character fade on the envelope letter's 6 lines with a particle-formation effect layered on top of the existing (already-working) text, without breaking accessibility, the existing typewriter schedule, or the existing test suite.

**Architecture:** One `<canvas>` overlay per letter line (`ParticleLine`), absolutely positioned over that line's real DOM text (unchanged `TypedText`). At the line's scheduled start time, particles scatter and steer toward pixel targets sampled from the line's own text rendered offscreen (with word-wrap for the multi-line intro), then the canvas fades out to reveal the real text already sitting beneath it. Only one line's canvas runs its physics loop at a time — the previous line has already settled and faded out before the next line's `startMs` arrives (180ms gap already baked into the existing schedule; each line's own formation targets ≤900ms).

**Tech Stack:** React + TypeScript, HTML5 Canvas 2D (no libraries), Vitest for unit tests. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-31-particle-letter-text-design.md`

## Global Constraints

- No new npm dependencies — Canvas 2D + `requestAnimationFrame`, same as the existing `HeroParticleField.tsx`.
- The real DOM text (`TypedText`, from commit `2551300`) must keep rendering unchanged — `ParticleLine` is a visual overlay, never a replacement. Screen readers, text selection, and browser zoom must keep working exactly as they do today.
- `buildTypeSchedule` / `computeTypeReveal` / `useTypewriterLines` in `EnvelopeInvite.tsx` are not modified — they're already tested (`envelopeTypewriter.test.ts`) and the particle timing reuses their output as-is.
- Must respect `prefers-reduced-motion: reduce` — no particle animation, real text appears via `TypedText`'s own (already reduced-motion-safe) path.
- Particle count per line capped at 400 (mobile performance — see spec "Rischi noti").

---

## Task 1: Word-wrap for particle text targets

**Files:**
- Create: `frontend/src/components/EnvelopeInvite/particleTextWrap.ts`
- Test: `frontend/src/__tests__/particleTextWrap.test.ts`

**Interfaces:**
- Produces: `wrapText(text: string, maxWidth: number, measureWidth: (line: string) => number): string[]`
  - `measureWidth` is injected (not `CanvasRenderingContext2D` directly) so this stays testable without mocking canvas — the real call site (Task 3) passes `(line) => ctx.measureText(line).width`.
  - Splits `text` on whitespace, greedily packs words onto a line while `measureWidth(candidateLine) <= maxWidth`, starts a new line otherwise. Returns `[]` for empty/whitespace-only input.

- [ ] **Step 1: Write the failing tests**

```typescript
// frontend/src/__tests__/particleTextWrap.test.ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd frontend && npx vitest run src/__tests__/particleTextWrap.test.ts`
Expected: FAIL — `Cannot find module '@/components/EnvelopeInvite/particleTextWrap'`

- [ ] **Step 3: Write the implementation**

```typescript
// frontend/src/components/EnvelopeInvite/particleTextWrap.ts

/**
 * Greedy word-wrap: packs words onto a line while they fit `maxWidth`
 * (per `measureWidth`), starts a new line otherwise. `measureWidth` is
 * injected rather than taking a CanvasRenderingContext2D directly so this
 * stays a pure, unit-testable function — ParticleLine.tsx passes
 * `(line) => ctx.measureText(line).width` at the real call site.
 *
 * No hyphenation, no justification: a single word longer than `maxWidth`
 * still gets its own line rather than being split mid-word.
 */
export function wrapText(text: string, maxWidth: number, measureWidth: (line: string) => number): string[] {
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  if (words.length === 0) {
    return [];
  }

  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i += 1) {
    const candidate = `${currentLine} ${words[i]}`;
    if (measureWidth(candidate) <= maxWidth) {
      currentLine = candidate;
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  lines.push(currentLine);

  return lines;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd frontend && npx vitest run src/__tests__/particleTextWrap.test.ts`
Expected: PASS, 5 tests

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/EnvelopeInvite/particleTextWrap.ts frontend/src/__tests__/particleTextWrap.test.ts
git commit -m "feat(fe): add word-wrap helper for particle text targets"
```

---

## Task 2: Particle steering physics

**Files:**
- Create: `frontend/src/components/EnvelopeInvite/particleSteering.ts`
- Test: `frontend/src/__tests__/particleSteering.test.ts`

**Interfaces:**
- Produces:
  - `type Vector2D = { x: number; y: number }`
  - `type SteeringParticle = { pos: Vector2D; vel: Vector2D; acc: Vector2D; target: Vector2D; maxSpeed: number; maxForce: number }`
  - `stepParticle(particle: SteeringParticle): void` — mutates `particle.pos`/`vel`/`acc` one physics step toward `particle.target`. Same steer-toward-target mechanic as `docs/deferred/particle-text-effect.md`'s `Particle.move()`, with the color-blend and kill/respawn bookkeeping removed (this use case never cycles a canvas to a new target — see spec "Perché non un porting 1:1 della demo").
  - `distanceToTarget(particle: SteeringParticle): number`

- [ ] **Step 1: Write the failing tests**

```typescript
// frontend/src/__tests__/particleSteering.test.ts
import { describe, expect, it } from 'vitest';

import { distanceToTarget, stepParticle, type SteeringParticle } from '@/components/EnvelopeInvite/particleSteering';

function makeParticle(overrides: Partial<SteeringParticle> = {}): SteeringParticle {
  return {
    pos: { x: 0, y: 0 },
    vel: { x: 0, y: 0 },
    acc: { x: 0, y: 0 },
    target: { x: 100, y: 0 },
    maxSpeed: 4,
    maxForce: 0.4,
    ...overrides,
  };
}

describe('stepParticle', () => {
  it('moves the particle closer to its target', () => {
    const particle = makeParticle();
    const before = distanceToTarget(particle);
    stepParticle(particle);
    const after = distanceToTarget(particle);
    expect(after).toBeLessThan(before);
  });

  it('accelerates roughly toward the target direction', () => {
    // Target is straight ahead on +x — after one step, position should
    // have moved in the +x direction (never sideways or backwards).
    const particle = makeParticle();
    stepParticle(particle);
    expect(particle.pos.x).toBeGreaterThan(0);
    expect(particle.pos.y).toBeCloseTo(0, 5);
  });

  it('slows down as it nears the target (does not overshoot wildly)', () => {
    const particle = makeParticle({ pos: { x: 99, y: 0 }, target: { x: 100, y: 0 } });
    stepParticle(particle);
    // Already almost at the target: speed should stay small, not jump to maxSpeed.
    const speed = Math.sqrt(particle.vel.x ** 2 + particle.vel.y ** 2);
    expect(speed).toBeLessThan(particle.maxSpeed);
  });

  it('converges to (near) zero distance over many steps', () => {
    const particle = makeParticle();
    for (let i = 0; i < 500; i += 1) {
      stepParticle(particle);
    }
    expect(distanceToTarget(particle)).toBeLessThan(1);
  });
});

describe('distanceToTarget', () => {
  it('computes straight-line distance to the target', () => {
    const particle = makeParticle({ pos: { x: 0, y: 0 }, target: { x: 3, y: 4 } });
    expect(distanceToTarget(particle)).toBe(5);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd frontend && npx vitest run src/__tests__/particleSteering.test.ts`
Expected: FAIL — `Cannot find module '@/components/EnvelopeInvite/particleSteering'`

- [ ] **Step 3: Write the implementation**

```typescript
// frontend/src/components/EnvelopeInvite/particleSteering.ts

export type Vector2D = { x: number; y: number };

export type SteeringParticle = {
  pos: Vector2D;
  vel: Vector2D;
  acc: Vector2D;
  target: Vector2D;
  maxSpeed: number;
  maxForce: number;
};

// Below this distance from its target, a particle scales its desired speed
// down proportionally instead of arriving at full maxSpeed — this is what
// keeps particles from overshooting and jittering around the target.
const CLOSE_ENOUGH_TARGET = 40;

/**
 * Advances one particle one physics step toward its target — a classic
 * "steer toward target" mechanic (seek + arrival), same as
 * `docs/deferred/particle-text-effect.md`'s `Particle.move()`, stripped of
 * the color-blend and kill/respawn bookkeeping that reference version
 * needed for cycling between demo words. This use case never cycles a
 * canvas to a new target, so none of that applies — see the design spec's
 * "Perché non un porting 1:1 della demo".
 *
 * Mutates `particle.pos`/`vel`/`acc` in place.
 */
export function stepParticle(particle: SteeringParticle): void {
  const dx = particle.target.x - particle.pos.x;
  const dy = particle.target.y - particle.pos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const proximityMult = distance < CLOSE_ENOUGH_TARGET ? distance / CLOSE_ENOUGH_TARGET : 1;

  let towardX = dx;
  let towardY = dy;
  const towardMagnitude = Math.sqrt(towardX * towardX + towardY * towardY);
  if (towardMagnitude > 0) {
    towardX = (towardX / towardMagnitude) * particle.maxSpeed * proximityMult;
    towardY = (towardY / towardMagnitude) * particle.maxSpeed * proximityMult;
  }

  let steerX = towardX - particle.vel.x;
  let steerY = towardY - particle.vel.y;
  const steerMagnitude = Math.sqrt(steerX * steerX + steerY * steerY);
  if (steerMagnitude > 0) {
    steerX = (steerX / steerMagnitude) * particle.maxForce;
    steerY = (steerY / steerMagnitude) * particle.maxForce;
  }

  particle.acc.x += steerX;
  particle.acc.y += steerY;
  particle.vel.x += particle.acc.x;
  particle.vel.y += particle.acc.y;
  particle.pos.x += particle.vel.x;
  particle.pos.y += particle.vel.y;
  particle.acc.x = 0;
  particle.acc.y = 0;
}

/** Straight-line distance from `particle.pos` to `particle.target`. */
export function distanceToTarget(particle: SteeringParticle): number {
  const dx = particle.target.x - particle.pos.x;
  const dy = particle.target.y - particle.pos.y;
  return Math.sqrt(dx * dx + dy * dy);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd frontend && npx vitest run src/__tests__/particleSteering.test.ts`
Expected: PASS, 5 tests

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/EnvelopeInvite/particleSteering.ts frontend/src/__tests__/particleSteering.test.ts
git commit -m "feat(fe): add particle steering physics for the letter text effect"
```

---

## Task 3: ParticleLine component + wire it into the letter

**Files:**
- Create: `frontend/src/components/EnvelopeInvite/ParticleLine.tsx`
- Create: `frontend/src/components/EnvelopeInvite/styles/ParticleLine.scss`
- Modify: `frontend/src/components/EnvelopeInvite/EnvelopeInvite.tsx`
- Modify: `frontend/src/components/EnvelopeInvite/styles/EnvelopeInvite.scss`

**Interfaces:**
- Consumes:
  - `wrapText(text: string, maxWidth: number, measureWidth: (line: string) => number): string[]` (Task 1)
  - `stepParticle(particle: SteeringParticle): void`, `distanceToTarget(particle: SteeringParticle): number`, `type SteeringParticle`, `type Vector2D` (Task 2)
  - `EnvelopeInvite.tsx`'s existing `schedule` array (`buildTypeSchedule(letterLines)`, already computed for `TypedText` — see `EnvelopeInvite.tsx` around the `useMemo` that builds `schedule`)
- Produces: `ParticleLine` component, `{ text: string; startMs: number; active: boolean }` props — no other file depends on this beyond `EnvelopeInvite.tsx`.

This is one task, not two, because `ParticleLine` in isolation reads real layout/font info from a host DOM element it doesn't control — it's only meaningfully verifiable once wired into the actual letter, so the wiring is part of this task's own deliverable rather than a follow-up.

- [ ] **Step 1: Write `ParticleLine.tsx`**

```tsx
// frontend/src/components/EnvelopeInvite/ParticleLine.tsx
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
      const lines = wrapText(text, width, (line) => ctx!.measureText(line).width);

      const offscreen = document.createElement('canvas');
      offscreen.width = canvas!.width;
      offscreen.height = canvas!.height;
      const offCtx = offscreen.getContext('2d')!;
      offCtx.setTransform(ctx!.getTransform());
      offCtx.font = font;
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

      function frame(now: number) {
        let totalDistance = 0;
        for (const particle of particles) {
          stepParticle(particle);
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
```

- [ ] **Step 2: Write `ParticleLine.scss`**

```scss
// frontend/src/components/EnvelopeInvite/styles/ParticleLine.scss

/* Absolute overlay on top of the real letter text (see the host selectors
   in EnvelopeInvite.scss that give each line `position: relative`).
   Starts transparent; ParticleLine.tsx flips this to 1 when its line's
   startMs arrives and back to 0 once particles settle — this transition
   is what makes that fade-out smooth. */
.particle-line {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  pointer-events: none;
  transition: opacity 220ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  /* Belt-and-suspenders: ParticleLine.tsx's effect already exits early
     under reduced motion and never touches this element's opacity, but
     forcing display:none here removes any doubt. */
  .particle-line {
    display: none;
  }
}
```

- [ ] **Step 3: Wire `ParticleLine` into `EnvelopeInvite.tsx`**

Add the import near the other `EnvelopeInvite`-local imports:

```tsx
import { ParticleLine } from '@/components/EnvelopeInvite/ParticleLine';
```

For each of the 6 `<TypedText .../>` usages, add a sibling `<ParticleLine
.../>` right after it, reusing that same line's `schedule[i]` entry.
Concretely, change this block (the one `useMemo`-computed `schedule` array
already exists from the earlier per-character-fade work — see the
`const schedule = useMemo(() => buildTypeSchedule(letterLines), [letterLines]);`
line already in this file):

```tsx
          <p
            className={`envelope-invite__personal-greeting${activeIndex === 0 ? ' is-typing' : ''}`}>
            <TypedText text={letterLines[0]} startMs={schedule[0].startMs} endMs={schedule[0].endMs} />
            <ParticleLine text={letterLines[0]} startMs={schedule[0].startMs} active={isOpen} />
          </p>
          <h1
            ref={letterHeadingRef}
            tabIndex={-1}
            className={`obw-display obw-display--sm envelope-invite__greeting${activeIndex === 1 ? ' is-typing' : ''}`}>
            <TypedText text={letterLines[1]} startMs={schedule[1].startMs} endMs={schedule[1].endMs} />
            <ParticleLine text={letterLines[1]} startMs={schedule[1].startMs} active={isOpen} />
          </h1>
          <p className={`envelope-invite__couple-names${activeIndex === 2 ? ' is-typing' : ''}`}>
            <TypedText text={letterLines[2]} startMs={schedule[2].startMs} endMs={schedule[2].endMs} />
            <ParticleLine text={letterLines[2]} startMs={schedule[2].startMs} active={isOpen} />
          </p>
          <p className={`envelope-invite__details${activeIndex === 3 ? ' is-typing' : ''}`}>
            <TypedText text={letterLines[3]} startMs={schedule[3].startMs} endMs={schedule[3].endMs} />
            <ParticleLine text={letterLines[3]} startMs={schedule[3].startMs} active={isOpen} />
          </p>
          <p className={`envelope-invite__ceremony-start${activeIndex === 4 ? ' is-typing' : ''}`}>
            <TypedText text={letterLines[4]} startMs={schedule[4].startMs} endMs={schedule[4].endMs} />
            <ParticleLine text={letterLines[4]} startMs={schedule[4].startMs} active={isOpen} />
          </p>
          <p className={`obw-body envelope-invite__body-text${activeIndex === 5 ? ' is-typing' : ''}`}>
            <TypedText text={letterLines[5]} startMs={schedule[5].startMs} endMs={schedule[5].endMs} />
            <ParticleLine text={letterLines[5]} startMs={schedule[5].startMs} active={isOpen} />
          </p>
```

(`endMs` is not a `ParticleLine` prop — only `startMs` is needed, the
formation's own end is driven by settling/`SETTLE_MAX_MS`, not by the
typing schedule's `endMs`.)

- [ ] **Step 4: Give each line host `position: relative` in `EnvelopeInvite.scss`**

Add near the other line-specific rules (e.g. right after
`.envelope-invite__personal-greeting`'s block):

```scss
/* Anchors each ParticleLine canvas overlay (position: absolute) to its
   own text line instead of some further-up positioned ancestor. */
.envelope-invite__personal-greeting,
.envelope-invite__greeting,
.envelope-invite__couple-names,
.envelope-invite__details,
.envelope-invite__ceremony-start,
.envelope-invite__body-text {
  position: relative;
}
```

- [ ] **Step 5: Typecheck**

Run: `cd frontend && npx tsc --noEmit -p .`
Expected: no errors mentioning `ParticleLine.tsx` or `EnvelopeInvite.tsx`

- [ ] **Step 6: Run the full test suite**

Run: `cd frontend && npx vitest run`
Expected: `particleTextWrap.test.ts`, `particleSteering.test.ts`, and
`envelopeTypewriter.test.ts` all pass. (`authRouteAccess.test.ts` and the
two `e2e/*.spec.ts` files were already failing before this plan — see
commit `2551300`'s message and the earlier `git stash` verification in
this session; unrelated to this change, do not attempt to fix them here.)

- [ ] **Step 7: Manual browser verification**

The dev stack should already be running (`http://localhost:5173`,
backend on `http://127.0.0.1:8000` — see `./scripts/run-dev.sh` if not).

1. Navigate to `http://localhost:5173/invito/emB0iwx14osHh_Ep` (the test
   invite link generated earlier this session — if it 404s, generate a
   fresh one: `cd backend && ./venv/bin/python scripts/generate_invite_links.py
   <a CSV with a first_name,last_name header row>`).
2. **Use a fresh tab**, not one reused from earlier in this session — this
   codebase's dev server has repeatedly shown stale-HMR artifacts in
   already-open tabs during this work; a fresh tab avoids false negatives.
3. Click the wax seal to start the opening video, wait for the letter to
   open.
4. For each of the 6 lines in turn, confirm: scattered dots visibly
   converge into the line's text, then fade out leaving crisp, correctly
   colored, correctly positioned real text (compare against what Task 6
   of the previous fix already confirmed the real text renders as — dark
   charcoal for most lines, gold for "Vi aspettiamo per le 17:00...").
5. Confirm the intro paragraph (the longest line) wraps onto multiple
   lines during particle formation and reads correctly once settled — this
   is the one line exercising Task 1's `wrapText`.
6. Confirm the RSVP section still appears shortly after the last line
   settles (unchanged from before — driven by `typingDone`, not by
   anything in this task).
7. In DevTools, enable "Emulate CSS prefers-reduced-motion: reduce"
   (Rendering tab), reload, reopen the envelope: confirm no particles
   render at all and the letter text still appears (via `TypedText`'s
   existing reduced-motion path).

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/EnvelopeInvite/ParticleLine.tsx frontend/src/components/EnvelopeInvite/styles/ParticleLine.scss frontend/src/components/EnvelopeInvite/EnvelopeInvite.tsx frontend/src/components/EnvelopeInvite/styles/EnvelopeInvite.scss
git commit -m "feat(fe): form each letter line from particles before settling"
```

---

## Self-Review Notes

- **Spec coverage**: one canvas per line (Task 3), overlay-not-replacement of real text (Task 3 Step 1's doc comment + Step 7.4 verification), word-wrap for the intro paragraph (Task 1, exercised in Step 7.5), fixed per-line color from `getComputedStyle` not random (Task 3 Step 1), no word-cycling/kill logic (Task 2 has no `kill`/color-blend at all), no trail — `clearRect` every frame (Task 3 Step 1's `draw()`), reduced-motion skip (Task 3 Step 1's early return + Step 7.7), one line simulating at a time (each line's own `setTimeout(startMs)` + settle/fade before the next line's gap elapses, per the spec's timing note), particle cap 400 (Global Constraints + Task 3's `MAX_PARTICLES`). All covered.
- **Placeholder scan**: no TBD/TODO; every step has real code or a concrete manual-verification checklist tied to this specific feature.
- **Type consistency**: `SteeringParticle`/`Vector2D` (Task 2) match their usage in `ParticleLine.tsx` (Task 3) field-for-field. `wrapText`'s signature (Task 1) matches its call site in `ParticleLine.tsx`'s `buildTargets()`.
