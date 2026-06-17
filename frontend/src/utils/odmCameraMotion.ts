import { Vector3 } from 'three';

import type {
  OdmAnchorSide,
  OdmCameraLeg,
  OdmCameraTuning,
  OdmGrapplePhase,
} from '@/types/odmCamera';
import type { CameraPose, NormalizedProgress } from '@/types/cameraRig';
import { HERO_CAMERA_FOV } from '@/utils/cameraConfig';

/** Default ODM tuning — snappy pulls, gravity drops, banking and speed FOV. */
export const DEFAULT_ODM_CAMERA_TUNING: OdmCameraTuning = {
  gravitySag: 4.2,
  overshootRatio: 0.16,
  pullExponent: 3.4,
  lateralSwing: 2.6,
  cableWobble: 0.1,
  releasePhaseEnd: 0.14,
  pullPhaseEnd: 0.76,
  releaseGravityBoost: 1.5,
  rollIntensity: 0.9,
  swingRoll: 0.14,
  redirectOvershoot: 1.15,
  baseFov: HERO_CAMERA_FOV,
  maxFov: 74,
  fovSpeedAtMax: 50,
};

const WORLD_UP = new Vector3(0, 1, 0);
const scratchDelta = new Vector3();
const scratchForward = new Vector3();
const scratchLateral = new Vector3();
const scratchInDir = new Vector3();
const scratchOutDir = new Vector3();

type MutableOdmCameraPose = {
  position: Vector3;
  target: Vector3;
  roll: number;
  fov: number;
  phase: OdmGrapplePhase;
};

export type ActiveOdmLeg = {
  readonly leg: OdmCameraLeg;
  readonly index: number;
  readonly localProgress: NormalizedProgress;
};

/** Clamps normalized scroll progress to [0, 1]. */
export function clampOdmProgress(value: number): NormalizedProgress {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(value: number): number {
  const clamped = clampOdmProgress(value);
  return clamped * clamped * (3 - 2 * clamped);
}

/** Resolves the active grapple phase for a leg-local progress sample. */
export function resolveOdmGrapplePhase(
  localProgress: number,
  tuning: OdmCameraTuning = DEFAULT_ODM_CAMERA_TUNING,
): OdmGrapplePhase {
  const t = clampOdmProgress(localProgress);

  if (t < tuning.releasePhaseEnd) {
    return 'release';
  }

  if (t < tuning.pullPhaseEnd) {
    return 'pull';
  }

  return 'overshoot';
}

/**
 * Grapple chord factor with release, acceleration pull and overshoot redirect beats.
 * Release = cable slack / gravity drop, pull = tightening toward anchor, overshoot = pass-through.
 */
export function grapplePullFactor(
  t: number,
  tuning: OdmCameraTuning = DEFAULT_ODM_CAMERA_TUNING,
): number {
  const clamped = clampOdmProgress(t);
  const { releasePhaseEnd, pullPhaseEnd, pullExponent, overshootRatio } = tuning;

  if (clamped <= releasePhaseEnd) {
    const phaseT = clamped / Math.max(releasePhaseEnd, 1e-6);
    return phaseT * phaseT * 0.07;
  }

  if (clamped <= pullPhaseEnd) {
    const phaseT = (clamped - releasePhaseEnd) / Math.max(pullPhaseEnd - releasePhaseEnd, 1e-6);
    const pullStart = 0.07;
    const pullTarget = 1 - overshootRatio * 0.28;
    return pullStart + (pullTarget - pullStart) * phaseT ** pullExponent;
  }

  const phaseT = (clamped - pullPhaseEnd) / Math.max(1 - pullPhaseEnd, 1e-6);
  const pullBase = 1 - overshootRatio * 0.28;
  const overshootTarget = 1 + overshootRatio;
  const redirectSnap = Math.sin(phaseT * Math.PI) * overshootRatio * 0.45;

  return pullBase + (overshootTarget - pullBase) * (1 - (1 - phaseT) ** 2.4) + redirectSnap;
}

/** Numerical derivative of the grapple pull factor for kinematic FOV hints. */
export function grapplePullVelocity(
  t: number,
  tuning: OdmCameraTuning = DEFAULT_ODM_CAMERA_TUNING,
): number {
  const epsilon = 0.004;
  const forward = grapplePullFactor(Math.min(1, t + epsilon), tuning);
  const backward = grapplePullFactor(Math.max(0, t - epsilon), tuning);

  return (forward - backward) / (2 * epsilon);
}

/** Maps camera speed to a widened FOV during fast grapple pulls. */
export function resolveOdmVelocityFov(
  speed: number,
  tuning: OdmCameraTuning = DEFAULT_ODM_CAMERA_TUNING,
): number {
  const normalized = clampOdmProgress(speed / Math.max(tuning.fovSpeedAtMax, 1e-6));
  const eased = normalized * normalized;

  return tuning.baseFov + (tuning.maxFov - tuning.baseFov) * eased;
}

/** Builds scroll-weighted legs between consecutive anchors (longer chords = more scroll time). */
export function buildOdmCameraLegs(
  anchors: readonly import('@/types/odmCamera').OdmAnchor[],
): OdmCameraLeg[] {
  if (anchors.length < 2) {
    return [];
  }

  const chordLengths = anchors.slice(0, -1).map((anchor, index) =>
    anchor.position.distanceTo(anchors[index + 1].position),
  );
  const totalLength = chordLengths.reduce((sum, length) => sum + length, 0);

  const legs: OdmCameraLeg[] = [];
  let cumulativeProgress = 0;

  for (let index = 0; index < chordLengths.length; index += 1) {
    const isLast = index === chordLengths.length - 1;
    const span = isLast
      ? 1 - cumulativeProgress
      : totalLength > 0
        ? chordLengths[index] / totalLength
        : 1 / chordLengths.length;

    legs.push({
      from: anchors[index],
      to: anchors[index + 1],
      start: cumulativeProgress,
      end: isLast ? 1 : cumulativeProgress + span,
      chordLength: chordLengths[index],
    });

    cumulativeProgress += span;
  }

  return legs;
}

/** Resolves the active ODM leg for a global scroll progress value. */
export function findActiveOdmLeg(
  legs: readonly OdmCameraLeg[],
  progress: number,
): ActiveOdmLeg {
  if (legs.length === 0) {
    throw new Error('ODM camera requires at least one leg.');
  }

  const clamped = clampOdmProgress(progress);
  const lastIndex = legs.length - 1;

  for (let index = 0; index < legs.length; index += 1) {
    const leg = legs[index];
    const isLast = index === lastIndex;
    const isActive =
      clamped >= leg.start && (clamped < leg.end || (isLast && clamped <= leg.end));

    if (!isActive) {
      continue;
    }

    const span = Math.max(leg.end - leg.start, 1e-6);
    return {
      leg,
      index,
      localProgress: clampOdmProgress((clamped - leg.start) / span),
    };
  }

  if (clamped < legs[0].start) {
    return { leg: legs[0], index: 0, localProgress: 0 };
  }

  const lastLeg = legs[lastIndex];
  return { leg: lastLeg, index: lastIndex, localProgress: 1 };
}

function resolveLateralAxis(forward: Vector3, out: Vector3): Vector3 {
  out.crossVectors(WORLD_UP, forward);

  if (out.lengthSq() < 1e-6) {
    out.set(1, 0, 0);
  } else {
    out.normalize();
  }

  return out;
}

function sideSign(side: OdmAnchorSide): number {
  return side === 'left' ? -1 : 1;
}

function legDirection(leg: OdmCameraLeg, out: Vector3): Vector3 {
  out.subVectors(leg.to.position, leg.from.position);

  if (out.lengthSq() < 1e-6) {
    out.set(0, 0, -1);
  } else {
    out.normalize();
  }

  return out;
}

function resolveGravityDrop(
  localProgress: number,
  phase: OdmGrapplePhase,
  tuning: OdmCameraTuning,
): number {
  const parabolic = 4 * localProgress * (1 - localProgress);
  let weight = 1;

  if (phase === 'release') {
    const releaseT = localProgress / Math.max(tuning.releasePhaseEnd, 1e-6);
    weight = tuning.releaseGravityBoost * (0.65 + releaseT * 0.35);
  } else if (phase === 'pull') {
    weight = 0.75 + Math.sin(Math.PI * localProgress) * 0.55;
  } else {
    weight = 0.45;
  }

  return parabolic * tuning.gravitySag * weight;
}

function computeRedirectRoll(
  legs: readonly OdmCameraLeg[],
  legIndex: number,
  localProgress: number,
  anchorSide: OdmAnchorSide,
  tuning: OdmCameraTuning,
): number {
  const leg = legs[legIndex];
  const nextLeg = legs[legIndex + 1];
  const swingRoll =
    sideSign(anchorSide) * Math.sin(Math.PI * localProgress) * tuning.swingRoll;

  if (!nextLeg) {
    return swingRoll;
  }

  const inDir = legDirection(leg, scratchInDir);
  const outDir = legDirection(nextLeg, scratchOutDir);
  const crossY = inDir.x * outDir.z - inDir.z * outDir.x;
  const turnSign = crossY >= 0 ? 1 : -1;
  const turnAngle = Math.acos(Math.min(1, Math.max(-1, inDir.dot(outDir))));
  const redirectBlend = smoothstep(
    (localProgress - tuning.pullPhaseEnd) / Math.max(1 - tuning.pullPhaseEnd, 1e-6),
  );

  return swingRoll + turnSign * turnAngle * redirectBlend * tuning.rollIntensity;
}

function resolveKinematicFov(
  leg: OdmCameraLeg,
  localProgress: number,
  tuning: OdmCameraTuning,
): number {
  const pullSpeed = Math.abs(grapplePullVelocity(localProgress, tuning));
  const pseudoSpeed = pullSpeed * leg.chordLength * 48;

  return resolveOdmVelocityFov(pseudoSpeed, tuning);
}

/**
 * Samples ODM camera position, aim, banking and FOV for one grapple leg.
 */
export function sampleOdmLegPose(
  legs: readonly OdmCameraLeg[],
  legIndex: number,
  localProgress: NormalizedProgress,
  out: MutableOdmCameraPose,
  tuning: OdmCameraTuning = DEFAULT_ODM_CAMERA_TUNING,
): void {
  const leg = legs[legIndex];
  const phase = resolveOdmGrapplePhase(localProgress, tuning);
  const pullFactor = grapplePullFactor(localProgress, tuning);
  const delta = scratchDelta.subVectors(leg.to.position, leg.from.position);
  const forward = scratchForward.copy(delta);

  if (forward.lengthSq() > 1e-6) {
    forward.normalize();
  } else {
    forward.set(0, 0, -1);
  }

  out.phase = phase;
  out.position.copy(leg.from.position).addScaledVector(delta, pullFactor);

  const gravitySag = resolveGravityDrop(localProgress, phase, tuning);
  out.position.y -= gravitySag;

  const lateralAxis = resolveLateralAxis(forward, scratchLateral);
  const swing = Math.sin(Math.PI * localProgress) * tuning.lateralSwing;
  out.position.addScaledVector(lateralAxis, swing * sideSign(leg.from.side));

  if (phase === 'overshoot') {
    const nextLeg = legs[legIndex + 1];

    if (nextLeg) {
      const overshootPhaseT =
        (localProgress - tuning.pullPhaseEnd) / Math.max(1 - tuning.pullPhaseEnd, 1e-6);
      const nextDir = legDirection(nextLeg, scratchOutDir);
      const redirectOffset =
        Math.sin(overshootPhaseT * Math.PI) *
        tuning.redirectOvershoot *
        leg.chordLength *
        0.08;

      out.position.addScaledVector(nextDir, redirectOffset);
    }
  }

  if (tuning.cableWobble > 0) {
    const wobblePhase = localProgress * 24 + leg.from.position.x * 0.2;
    const wobbleEnvelope = localProgress * (1 - localProgress);
    out.position.addScaledVector(
      lateralAxis,
      Math.sin(wobblePhase * 19) * tuning.cableWobble * wobbleEnvelope,
    );
    out.position.y += Math.sin(wobblePhase * 11) * tuning.cableWobble * 0.55 * wobbleEnvelope;
  }

  const lookAhead = Math.min(1.3, pullFactor + 0.2 + tuning.overshootRatio * 0.4);
  out.target.copy(leg.from.position).addScaledVector(delta, lookAhead);
  out.target.y -= gravitySag * 0.72;
  out.target.addScaledVector(lateralAxis, sideSign(leg.from.side) * swing * 0.42);
  out.roll = computeRedirectRoll(legs, legIndex, localProgress, leg.from.side, tuning);
  out.fov = resolveKinematicFov(leg, localProgress, tuning);
}

/**
 * Resolves the full ODM camera frame for scroll progress across all grapple legs.
 */
export function resolveOdmCameraPose(
  legs: readonly OdmCameraLeg[],
  progress: number,
  out: MutableOdmCameraPose,
  tuning: OdmCameraTuning = DEFAULT_ODM_CAMERA_TUNING,
): CameraPose & { roll: number; fov: number; phase: OdmGrapplePhase } {
  const active = findActiveOdmLeg(legs, progress);
  sampleOdmLegPose(legs, active.index, active.localProgress, out, tuning);
  return out;
}

/** Validates ODM legs cover [0, 1] without gaps. */
export function assertValidOdmCameraLegs(legs: readonly OdmCameraLeg[]): void {
  if (legs.length === 0) {
    throw new Error('ODM camera legs must not be empty.');
  }

  if (legs[0].start > 1e-6) {
    throw new Error('ODM legs must start at progress 0.');
  }

  const lastLeg = legs[legs.length - 1];

  if (lastLeg.end < 1 - 1e-6) {
    throw new Error('ODM legs must end at progress 1.');
  }

  for (let index = 1; index < legs.length; index += 1) {
    const previous = legs[index - 1];
    const current = legs[index];

    if (Math.abs(previous.end - current.start) > 1e-6) {
      throw new Error(`ODM leg gap between index ${index - 1} and ${index}.`);
    }
  }
}
