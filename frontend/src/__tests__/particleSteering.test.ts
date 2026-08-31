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
