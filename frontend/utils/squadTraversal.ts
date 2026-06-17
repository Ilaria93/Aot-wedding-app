import { Vector3 } from 'three';

import { CAMERA_PATHS } from '@/src/data/cameraPaths';
import { OPERATION_RAVENNA_TIMELINE } from '@/constants/operationRavennaTimeline';
import { getSquadMemberKeyframes } from '@/constants/squadTraversalManeuvers';
import { ODM_CAMERA_LEGS } from '@/src/data/odmCameraAnchors';
import type {
  SquadMemberId,
  SquadMemberOffset,
  SquadMemberPose,
  SquadOffsetKeyframe,
  SquadTraversalProgress,
  SquadTraversalState,
} from '@/types/squadTraversal';
import { DEFAULT_ODM_CAMERA_TUNING, resolveOdmCameraPose } from '@/utils/odmCameraMotion';
import { clampTimelineProgress, toSceneLocalProgress } from '@/utils/sceneTimeline';

const ROOFTOPS_SCENE = OPERATION_RAVENNA_TIMELINE.scenes[0];
const ROOFTOPS_CAMERA_SEGMENT = CAMERA_PATHS[0];
const ROOFTOPS_CAMERA_SPAN = ROOFTOPS_CAMERA_SEGMENT.end - ROOFTOPS_CAMERA_SEGMENT.start;

const WORLD_UP = new Vector3(0, 1, 0);
const scratchPosition = new Vector3();
const scratchTarget = new Vector3();
const scratchForward = new Vector3();
const scratchLateral = new Vector3();
const scratchPrev = new Vector3();
const scratchNext = new Vector3();

type PathFrame = {
  position: Vector3;
  forward: Vector3;
  lateral: Vector3;
};

type MutablePathFrame = {
  position: Vector3;
  forward: Vector3;
  lateral: Vector3;
};

/** Approximate rooftops chord length in world units for forward-offset conversion. */
export function getRooftopsPathLengthMeters(): number {
  return ODM_CAMERA_LEGS.reduce((total, leg) => {
    if (leg.start >= ROOFTOPS_CAMERA_SEGMENT.end) {
      return total;
    }

    if (leg.end <= ROOFTOPS_CAMERA_SEGMENT.start) {
      return total;
    }

    const span = Math.max(leg.end - leg.start, 1e-6);
    const overlapStart = Math.max(leg.start, ROOFTOPS_CAMERA_SEGMENT.start);
    const overlapEnd = Math.min(leg.end, ROOFTOPS_CAMERA_SEGMENT.end);
    const fraction = (overlapEnd - overlapStart) / span;

    return total + leg.chordLength * fraction;
  }, 0);
}

const ROOFTOPS_PATH_LENGTH_METERS = getRooftopsPathLengthMeters();

/** Maps global hero scroll progress to rooftops-local traversal progress [0, 1]. */
export function getRooftopsTraversalProgress(globalProgress: number): SquadTraversalProgress {
  return toSceneLocalProgress(ROOFTOPS_SCENE, globalProgress);
}

/** Returns whether the rooftops squad sequence should be active. */
export function isRooftopsSquadActive(globalProgress: number): boolean {
  const clamped = clampTimelineProgress(globalProgress);
  return clamped >= ROOFTOPS_SCENE.start && clamped < ROOFTOPS_SCENE.end;
}

/** Maps rooftops-local progress to global camera path progress. */
export function rooftopsTraversalToCameraProgress(
  traversalProgress: SquadTraversalProgress,
): number {
  const clamped = clampTimelineProgress(traversalProgress);
  return ROOFTOPS_CAMERA_SEGMENT.start + clamped * ROOFTOPS_CAMERA_SPAN;
}

function smoothstep(value: number): number {
  const clamped = clampTimelineProgress(value);
  return clamped * clamped * (3 - 2 * clamped);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function offsetFromKeyframe(
  frame: SquadOffsetKeyframe,
  localT: number,
): SquadMemberOffset {
  let forward = frame.forward;
  let lateral = frame.lateral;
  let vertical = frame.vertical;

  if (frame.kind === 'overtake') {
    const surge = Math.sin(localT * Math.PI) * 0.85;
    forward += surge;
    vertical += surge * 0.15;
  }

  if (frame.kind === 'crossFront') {
    lateral += Math.sin(localT * Math.PI) * 2.4;
    forward += Math.sin(localT * Math.PI) * 1.2;
  }

  return {
    forward,
    lateral,
    vertical,
    visibility: frame.visibility ?? 1,
  };
}

/** Resolves scripted maneuver offsets for one squad member (test and debug helper). */
export function resolveSquadManeuverOffset(
  member: SquadMemberId,
  traversalProgress: SquadTraversalProgress,
): SquadMemberOffset {
  return resolveManeuverOffset(getSquadMemberKeyframes(member), traversalProgress);
}

function resolveManeuverOffset(
  keyframes: readonly SquadOffsetKeyframe[],
  progress: SquadTraversalProgress,
): SquadMemberOffset {
  const clamped = clampTimelineProgress(progress);
  const first = keyframes[0];
  const last = keyframes[keyframes.length - 1];

  if (clamped <= first.start) {
    return offsetFromKeyframe(first, 0);
  }

  if (clamped >= last.end) {
    return offsetFromKeyframe(last, 1);
  }

  for (let index = 0; index < keyframes.length; index += 1) {
    const frame = keyframes[index];

    if (clamped < frame.start || clamped > frame.end) {
      continue;
    }

    const span = Math.max(frame.end - frame.start, 1e-6);
    const localT = smoothstep((clamped - frame.start) / span);
    const current = offsetFromKeyframe(frame, localT);
    const next = keyframes[index + 1];

    if (!next || clamped < frame.end - span * 0.12) {
      return current;
    }

    const blendT = smoothstep((clamped - (frame.end - span * 0.12)) / (span * 0.12));
    const upcoming = offsetFromKeyframe(next, 0);

    return {
      forward: lerp(current.forward, upcoming.forward, blendT),
      lateral: lerp(current.lateral, upcoming.lateral, blendT),
      vertical: lerp(current.vertical, upcoming.vertical, blendT),
      visibility: lerp(current.visibility, upcoming.visibility, blendT),
    };
  }

  return offsetFromKeyframe(last, 1);
}

function forwardMetersToCameraDelta(forwardMeters: number): number {
  if (ROOFTOPS_PATH_LENGTH_METERS <= 0) {
    return 0;
  }

  return (forwardMeters / ROOFTOPS_PATH_LENGTH_METERS) * ROOFTOPS_CAMERA_SPAN;
}

function samplePathFrame(cameraProgress: number, out: MutablePathFrame): PathFrame {
  const epsilon = 0.004;
  const nextProgress = Math.min(1, cameraProgress + epsilon);
  const prevProgress = Math.max(0, cameraProgress - epsilon);

  resolveOdmCameraPose(
    ODM_CAMERA_LEGS,
    cameraProgress,
    { position: scratchPosition, target: scratchTarget },
    DEFAULT_ODM_CAMERA_TUNING,
  );
  resolveOdmCameraPose(
    ODM_CAMERA_LEGS,
    nextProgress,
    { position: scratchNext, target: scratchTarget },
    DEFAULT_ODM_CAMERA_TUNING,
  );
  resolveOdmCameraPose(
    ODM_CAMERA_LEGS,
    prevProgress,
    { position: scratchPrev, target: scratchTarget },
    DEFAULT_ODM_CAMERA_TUNING,
  );

  out.position.copy(scratchPosition);
  out.forward.subVectors(scratchNext, scratchPrev);

  if (out.forward.lengthSq() < 1e-6) {
    out.forward.set(0, 0, -1);
  } else {
    out.forward.normalize();
  }

  out.lateral.crossVectors(WORLD_UP, out.forward);

  if (out.lateral.lengthSq() < 1e-6) {
    out.lateral.set(1, 0, 0);
  } else {
    out.lateral.normalize();
  }

  return out;
}

/**
 * Resolves a squad member world pose from rooftops traversal progress and scripted offsets.
 * Preserves forward momentum — no teleportation.
 */
export function resolveSquadMemberPose(
  member: SquadMemberId,
  traversalProgress: SquadTraversalProgress,
  out: Vector3,
): SquadMemberPose {
  const keyframes = getSquadMemberKeyframes(member);
  const offset = resolveManeuverOffset(keyframes, traversalProgress);
  const cameraProgress = rooftopsTraversalToCameraProgress(traversalProgress);
  const memberProgress = clampTimelineProgress(
    cameraProgress + forwardMetersToCameraDelta(offset.forward),
  );

  const frame = samplePathFrame(memberProgress, {
    position: scratchPosition,
    forward: scratchForward,
    lateral: scratchLateral,
  });

  out
    .copy(frame.position)
    .addScaledVector(frame.lateral, offset.lateral)
    .addScaledVector(WORLD_UP, offset.vertical);

  const yaw = Math.atan2(frame.forward.x, frame.forward.z);
  const pitch = Math.atan2(
    frame.forward.y,
    Math.hypot(frame.forward.x, frame.forward.z),
  );

  return {
    position: [out.x, out.y, out.z],
    rotation: [pitch * 0.35, yaw, offset.lateral * -0.04],
    visibility: clampTimelineProgress(offset.visibility),
  };
}

/** Resolves bride and groom poses for the rooftops squad traversal sequence. */
export function resolveSquadTraversal(
  traversalProgress: SquadTraversalProgress,
): SquadTraversalState {
  const progress = clampTimelineProgress(traversalProgress);
  const bridePosition = new Vector3();
  const groomPosition = new Vector3();

  return {
    progress,
    bride: resolveSquadMemberPose('bride', progress, bridePosition),
    groom: resolveSquadMemberPose('groom', progress, groomPosition),
  };
}

/** Resolves squad traversal from global hero scroll progress. */
export function resolveSquadTraversalFromGlobal(globalProgress: number): SquadTraversalState {
  return resolveSquadTraversal(getRooftopsTraversalProgress(globalProgress));
}
