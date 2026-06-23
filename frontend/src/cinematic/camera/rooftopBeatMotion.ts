import { Vector3 } from 'three';

import {
  resolveRooftopBeatWindows,
  ROOFTOP_STREET_LAUNCH,
} from '@/data/rooftopTraversalBeats';
import {
  FIRST_ODM_LAUNCH_TUNING,
  ROOFTOP_ODM_SWING_TUNING,
  clampOdmProgress,
} from '@/cinematic/camera/odmCameraMotion';
import type { OdmAnchorSide, OdmCameraTuning, OdmGrapplePhase } from '@/types/odmCamera';
import type { CameraPose, NormalizedProgress } from '@/types/cameraRig';
import type { RooftopBeatKind, RooftopBeatWindow } from '@/types/rooftopTraversal';

const WORLD_UP = new Vector3(0, 1, 0);
const scratchForward = new Vector3();
const scratchLateral = new Vector3();
const scratchLook = new Vector3();
const scratchPullEnd = new Vector3();

/** Meters the camera stays outside the facade while rising on the cable. */
const FACADE_STREET_OFFSET = 2.6;

type MutableRooftopPose = {
  position: Vector3;
  target: Vector3;
  roll: number;
  fov: number;
  phase: OdmGrapplePhase;
  beatKind: RooftopBeatKind;
};

export type ActiveRooftopBeat = {
  readonly beat: RooftopBeatWindow;
  readonly index: number;
  readonly localProgress: NormalizedProgress;
};

function snapstep(value: number): number {
  const clamped = clampOdmProgress(value);
  return clamped < 0.5 ? 0 : 1;
}

function sharpstep(value: number): number {
  const clamped = clampOdmProgress(value);
  return clamped * clamped * clamped * (clamped * (clamped * 6 - 15) + 10);
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

function sideSign(side: RooftopBeatWindow['hookSide']): number {
  return side === 'left' ? -1 : 1;
}

function enforceMinY(position: Vector3, minY: number): void {
  position.y = Math.max(position.y, minY);
}

function quadraticBezier(from: Vector3, apex: Vector3, to: Vector3, t: number, out: Vector3): void {
  const oneMinus = 1 - t;
  out
    .copy(from)
    .multiplyScalar(oneMinus * oneMinus)
    .addScaledVector(apex, 2 * oneMinus * t)
    .addScaledVector(to, t * t);
}

function resolveBeatTuning(beat: RooftopBeatWindow): OdmCameraTuning {
  if (beat.kind === 'pull' && beat.from.distanceTo(ROOFTOP_STREET_LAUNCH) < 6) {
    return FIRST_ODM_LAUNCH_TUNING;
  }

  return ROOFTOP_ODM_SWING_TUNING;
}

/**
 * Eye position beside the facade after a vertical pull — never inside the building volume.
 * Left facade hooks offset toward street center (+X); right hooks offset toward center (-X).
 */
export function resolvePullEndBesideFacade(
  hook: Vector3,
  side: OdmAnchorSide,
  out: Vector3 = new Vector3(),
): Vector3 {
  const xOffset = side === 'left' ? FACADE_STREET_OFFSET : -FACADE_STREET_OFFSET;
  out.set(hook.x + xOffset, hook.y - 1.1, hook.z);
  return out;
}

function mapBeatKindToPhase(kind: RooftopBeatKind, localProgress: number): OdmGrapplePhase {
  if (kind === 'hook') {
    return localProgress < 0.55 ? 'release' : 'pull';
  }

  if (kind === 'jump') {
    return localProgress < 0.45 ? 'release' : 'pull';
  }

  if (kind === 'pull') {
    return localProgress < 0.85 ? 'pull' : 'overshoot';
  }

  if (kind === 'swing') {
    return localProgress < 0.85 ? 'pull' : 'overshoot';
  }

  if (kind === 'land') {
    return 'overshoot';
  }

  return 'overshoot';
}

/** Two staccato roof steps — forward along the corridor, stable horizon. */
function sampleRunBeat(beat: RooftopBeatWindow, localProgress: number, out: MutableRooftopPose): void {
  const steps = beat.runSteps ?? [beat.from, beat.to];
  const first = steps[0];
  const second = steps[1] ?? beat.to;

  if (localProgress < 0.5) {
    out.position.lerpVectors(beat.from, first, localProgress * 2);
  } else {
    out.position.lerpVectors(first, second, (localProgress - 0.5) * 2);
  }

  const footStrike = snapstep(localProgress * 2) !== snapstep(localProgress * 2 - 0.01);
  out.position.y += footStrike ? 0.015 : -0.012;
  enforceMinY(out.position, beat.minY);

  scratchForward.subVectors(second, beat.from);

  if (scratchForward.lengthSq() < 1e-6) {
    scratchForward.set(0, 0, -1);
  } else {
    scratchForward.normalize();
  }

  out.target.copy(out.position).addScaledVector(scratchForward, 4).add(new Vector3(0, -0.15, 0));
  out.roll = Math.sin(localProgress * Math.PI * 4) * 0.012;
  out.fov = 60;
}

/** Snap aim at the architectural hook — cable fires, body stays in open air. */
function sampleHookBeat(beat: RooftopBeatWindow, localProgress: number, out: MutableRooftopPose): void {
  const hook = beat.hookAnchor ?? beat.to;
  out.position.copy(beat.from);

  scratchForward.subVectors(beat.from, hook);

  if (scratchForward.lengthSq() > 1e-6) {
    scratchForward.normalize();
    out.position.addScaledVector(scratchForward, 0.08 * (1 - localProgress));
  }

  enforceMinY(out.position, beat.minY);
  out.target.copy(hook);
  out.roll = sideSign(beat.hookSide) * localProgress * 0.018;
  out.fov = 58;
}

/** Vertical rise beside the facade — pulled up by the cable, never through the wall. */
function samplePullBeat(
  beat: RooftopBeatWindow,
  localProgress: number,
  tuning: OdmCameraTuning,
  out: MutableRooftopPose,
): void {
  const hook = beat.hookAnchor ?? beat.to;
  const side = beat.hookSide ?? 'left';
  const pullEnd = resolvePullEndBesideFacade(hook, side, scratchPullEnd);
  const rise = sharpstep(localProgress);

  out.position.lerpVectors(beat.from, pullEnd, rise);
  out.position.y -= Math.sin(rise * Math.PI) * tuning.gravitySag * 0.12;
  enforceMinY(out.position, beat.minY);

  out.target.copy(hook);
  out.roll = sideSign(side) * Math.sin(localProgress * Math.PI) * tuning.swingRoll * 0.8;
  out.fov = 58 + rise * 2;
}

/** Pendulum arc beside the building — from pull height to the next rooftop. */
function sampleSwingBeat(
  beat: RooftopBeatWindow,
  localProgress: number,
  tuning: OdmCameraTuning,
  out: MutableRooftopPose,
): void {
  const hook = beat.hookAnchor ?? beat.from;
  const apex = beat.apex ?? hook;
  const side = beat.hookSide ?? 'left';
  const swingStart = resolvePullEndBesideFacade(hook, side, scratchPullEnd);
  const travel = sharpstep(localProgress);

  quadraticBezier(swingStart, apex, beat.to, travel, out.position);
  enforceMinY(out.position, beat.minY);

  scratchLook.lerpVectors(hook, beat.to, travel);
  out.target.copy(scratchLook);
  out.roll = sideSign(side) * Math.sin(localProgress * Math.PI) * tuning.swingRoll * 1.2;
  out.fov = 60;
}

/** Rooftop touchdown — already at destination, short impact settle only. */
function sampleLandBeat(beat: RooftopBeatWindow, localProgress: number, out: MutableRooftopPose): void {
  out.position.copy(beat.to);
  out.position.y += Math.sin(localProgress * Math.PI) * 0.1 * (1 - localProgress);
  enforceMinY(out.position, beat.minY);

  scratchForward.subVectors(beat.to, beat.from);

  if (scratchForward.lengthSq() < 1e-6) {
    scratchForward.set(0, 0, -1);
  } else {
    scratchForward.normalize();
  }

  out.target.copy(out.position).addScaledVector(scratchForward, 3.5).add(new Vector3(0, -0.2, 0));
  out.roll = Math.sin(localProgress * Math.PI) * 0.012 * (1 - localProgress);
  out.fov = 59;
}

/** Short leap off the roof edge — commits to the next hook. */
function sampleJumpBeat(beat: RooftopBeatWindow, localProgress: number, out: MutableRooftopPose): void {
  const travel = sharpstep(localProgress);
  out.position.lerpVectors(beat.from, beat.to, travel);
  const apex = beat.apex ?? beat.to;
  const arc = Math.sin(localProgress * Math.PI);
  out.position.y = beat.from.y + (apex.y - beat.from.y) * arc;
  enforceMinY(out.position, beat.minY);

  if (beat.hookAnchor && localProgress > 0.45) {
    out.target.lerpVectors(beat.to, beat.hookAnchor, sharpstep((localProgress - 0.45) / 0.55));
  } else {
    scratchForward.subVectors(beat.to, beat.from);

    if (scratchForward.lengthSq() < 1e-6) {
      scratchForward.set(0, 0, -1);
    } else {
      scratchForward.normalize();
    }

    out.target.copy(out.position).addScaledVector(scratchForward, 3);
  }

  out.roll = sideSign(beat.hookSide) * arc * 0.025;
  out.fov = 59 + arc * 3;
}

/** Finds the active rooftop beat for aerial progress in [0, 1]. */
export function findActiveRooftopBeat(progress: number): ActiveRooftopBeat {
  const beatWindows = resolveRooftopBeatWindows();
  const clamped = clampOdmProgress(progress);
  const lastIndex = beatWindows.length - 1;

  for (let index = 0; index < beatWindows.length; index += 1) {
    const beat = beatWindows[index];
    const isLast = index === lastIndex;
    const isActive =
      clamped >= beat.start && (clamped < beat.end || (isLast && clamped <= beat.end));

    if (!isActive) {
      continue;
    }

    const span = Math.max(beat.end - beat.start, 1e-6);
    return {
      beat,
      index,
      localProgress: clampOdmProgress((clamped - beat.start) / span),
    };
  }

  const fallback = beatWindows[lastIndex];
  return {
    beat: fallback,
    index: lastIndex,
    localProgress: 1,
  };
}

/** Samples camera pose for one rooftop gameplay beat. */
export function sampleRooftopBeatPose(
  beat: RooftopBeatWindow,
  localProgress: NormalizedProgress,
  out: MutableRooftopPose,
): void {
  const tuning = resolveBeatTuning(beat);
  out.beatKind = beat.kind;
  out.phase = mapBeatKindToPhase(beat.kind, localProgress);

  switch (beat.kind) {
    case 'run':
      sampleRunBeat(beat, localProgress, out);
      break;
    case 'hook':
      sampleHookBeat(beat, localProgress, out);
      break;
    case 'pull':
      samplePullBeat(beat, localProgress, tuning, out);
      break;
    case 'swing':
      sampleSwingBeat(beat, localProgress, tuning, out);
      break;
    case 'land':
      sampleLandBeat(beat, localProgress, out);
      break;
    case 'jump':
      sampleJumpBeat(beat, localProgress, out);
      break;
    default:
      out.position.lerpVectors(beat.from, beat.to, localProgress);
      out.target.copy(beat.to);
      out.roll = 0;
      out.fov = tuning.baseFov;
  }
}

/**
 * Resolves rooftop traversal pose from aerial progress using discrete ODM beats.
 */
export function resolveRooftopTraversalPose(
  aerialProgress: number,
  out: MutableRooftopPose,
): CameraPose & { roll: number; fov: number; phase: OdmGrapplePhase; beatKind: RooftopBeatKind } {
  const active = findActiveRooftopBeat(aerialProgress);
  sampleRooftopBeatPose(active.beat, active.localProgress, out);
  return out;
}

/** Total rooftop traversal path length in meters (for squad offset conversion). */
export function getRooftopBeatPathLengthMeters(): number {
  let total = 0;

  for (const beat of resolveRooftopBeatWindows()) {
    total += beat.from.distanceTo(beat.to);

    if (beat.apex) {
      total += beat.from.distanceTo(beat.apex) * 0.35;
    }

    if (beat.hookAnchor) {
      total += beat.from.distanceTo(beat.hookAnchor) * 0.25;
    }
  }

  return Math.max(total, 1);
}

/** First architectural hook after the street launch. */
export function getFirstRooftopHookAnchor(out: Vector3 = new Vector3()): Vector3 {
  const firstHook = resolveRooftopBeatWindows().find(
    (beat) => beat.kind === 'hook' && beat.hookAnchor,
  )?.hookAnchor;

  return firstHook ? out.copy(firstHook) : out.copy(ROOFTOP_STREET_LAUNCH);
}
