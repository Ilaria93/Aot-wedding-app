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
 * `deltaFrames` scales the step to the actual time elapsed since the last
 * frame, expressed as a multiple of a nominal 60fps frame (1 = 1/60s). This
 * is what `HeroParticleField.tsx` does with `deltaSeconds` for continuous
 * motion — here the physics was originally written as "1 unit per call", so
 * frames are the natural unit rather than seconds. Without this, a slower
 * device (fewer, longer frames) covers less distance for the same wall-clock
 * budget, because the physics advances per *call* rather than per unit of
 * real time. Defaults to 1 so existing call sites (and tests) keep behaving
 * exactly as before.
 *
 * Mutates `particle.pos`/`vel`/`acc` in place.
 */
export function stepParticle(particle: SteeringParticle, deltaFrames = 1): void {
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

  particle.acc.x += steerX * deltaFrames;
  particle.acc.y += steerY * deltaFrames;
  particle.vel.x += particle.acc.x;
  particle.vel.y += particle.acc.y;
  particle.pos.x += particle.vel.x * deltaFrames;
  particle.pos.y += particle.vel.y * deltaFrames;
  particle.acc.x = 0;
  particle.acc.y = 0;
}

/** Straight-line distance from `particle.pos` to `particle.target`. */
export function distanceToTarget(particle: SteeringParticle): number {
  const dx = particle.target.x - particle.pos.x;
  const dy = particle.target.y - particle.pos.y;
  return Math.sqrt(dx * dx + dy * dy);
}
