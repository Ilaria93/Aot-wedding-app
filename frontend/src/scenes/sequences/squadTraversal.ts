import { Vector3 } from 'three';

import { OPERATION_RAVENNA_TIMELINE } from '@/constants/operationRavennaTimeline';
import {
  OPENING_SQUAD_HOOK_CHOREOGRAPHY,
  OPERATION_RAVENNA_GROUND_SPRINT_END,
  OPERATION_RAVENNA_ROOFTOPS_END,
} from '@/constants/operationRavennaOpening';
import { getSquadMemberKeyframes } from '@/constants/squadTraversalManeuvers';
import type { OdmGrapplePhase } from '@/types/odmCamera';
import type {
  SquadMemberId,
  SquadMemberOffset,
  SquadMemberPose,
  SquadOffsetKeyframe,
  SquadTraversalProgress,
  SquadTraversalState,
} from '@/types/squadTraversal';
import {
  mapGlobalProgressToAerialOdm,
} from '@/cinematic/camera/openingCameraMotion';
import {
  getRooftopBeatPathLengthMeters,
  resolveRooftopTraversalPose,
} from '@/cinematic/camera/rooftopBeatMotion';
import { clampTimelineProgress } from '@/cinematic/timeline/sceneTimeline';

const WORLD_UP = new Vector3(0, 1, 0);
const scratchPosition = new Vector3();
const scratchTarget = new Vector3();
const scratchForward = new Vector3();
const scratchLateral = new Vector3();
const scratchPrev = new Vector3();
const scratchNext = new Vector3();

type ScratchOdmPose = {
  position: Vector3;
  target: Vector3;
  roll: number;
  fov: number;
  phase: OdmGrapplePhase;
  beatKind: 'run';
};

const scratchPose: ScratchOdmPose = {
  position: scratchPosition,
  target: scratchTarget,
  roll: 0,
  fov: 50,
  phase: 'pull',
  beatKind: 'run',
};

const scratchNextPose: ScratchOdmPose = {
  position: scratchNext,
  target: scratchTarget,
  roll: 0,
  fov: 50,
  phase: 'pull',
  beatKind: 'run',
};

const scratchPrevPose: ScratchOdmPose = {
  position: scratchPrev,
  target: scratchTarget,
  roll: 0,
  fov: 50,
  phase: 'pull',
  beatKind: 'run',
};

type MutablePathFrame = {
  position: Vector3;
  forward: Vector3;
  lateral: Vector3;
};

/** Approximate rooftops beat path length in world units for forward-offset conversion. */
export function getRooftopsPathLengthMeters(): number {
  return getRooftopBeatPathLengthMeters();
}

const ROOFTOPS_PATH_LENGTH_METERS = getRooftopsPathLengthMeters();
const ROOFTOPS_CAMERA_SPAN = OPERATION_RAVENNA_ROOFTOPS_END - OPERATION_RAVENNA_GROUND_SPRINT_END;

/**
 * Squad choreography progress [0, 1] — aligned so the hook moment matches existing keyframes.
 * Squad is hidden during the quiet street opening and appears with the first ODM launch.
 */
export function resolveSquadChoreographyProgress(globalProgress: number): SquadTraversalProgress {
  if (globalProgress < OPERATION_RAVENNA_GROUND_SPRINT_END) {
    return 0;
  }

  const aerialSpan = OPERATION_RAVENNA_ROOFTOPS_END - OPERATION_RAVENNA_GROUND_SPRINT_END;
  const aerialT = clampTimelineProgress(
    (globalProgress - OPERATION_RAVENNA_GROUND_SPRINT_END) / aerialSpan,
  );
  const hook = OPENING_SQUAD_HOOK_CHOREOGRAPHY;

  return hook + aerialT * (1 - hook);
}

/** @deprecated Use resolveSquadChoreographyProgress — kept for tests. */
export function getStreetOpeningTraversalProgress(globalProgress: number): SquadTraversalProgress {
  const scene = OPERATION_RAVENNA_TIMELINE.scenes[0];
  const span = scene.end - scene.start;

  if (span <= 0) {
    return 0;
  }

  return clampTimelineProgress((globalProgress - scene.start) / span);
}

/** @deprecated Use resolveSquadChoreographyProgress — kept for tests. */
export function getRooftopsTraversalProgress(globalProgress: number): SquadTraversalProgress {
  const scene = OPERATION_RAVENNA_TIMELINE.scenes[1];
  const span = scene.end - scene.start;

  if (span <= 0) {
    return 0;
  }

  return clampTimelineProgress((globalProgress - scene.start) / span);
}

/** Squad appears only once the existing rooftop ODM traversal begins. */
export function isRooftopsSquadActive(globalProgress: number): boolean {
  const clamped = clampTimelineProgress(globalProgress);
  return (
    clamped >= OPERATION_RAVENNA_GROUND_SPRINT_END &&
    clamped < OPERATION_RAVENNA_ROOFTOPS_END
  );
}

/** Maps choreography progress to global camera path progress during aerial traversal. */
export function rooftopsTraversalToCameraProgress(
  choreographyProgress: SquadTraversalProgress,
): number {
  const hookChoreography = OPERATION_RAVENNA_GROUND_SPRINT_END / OPERATION_RAVENNA_ROOFTOPS_END;
  const aerialChoreography = clampTimelineProgress(choreographyProgress) - hookChoreography;
  const aerialSpan = 1 - hookChoreography;

  if (aerialChoreography <= 0) {
    return OPERATION_RAVENNA_GROUND_SPRINT_END;
  }

  return OPERATION_RAVENNA_GROUND_SPRINT_END +
    clampTimelineProgress(aerialChoreography / aerialSpan) * ROOFTOPS_CAMERA_SPAN;
}

function smoothstep(value: number): number {
  const clamped = clampTimelineProgress(value);
  return clamped * clamped * (3 - 2 * clamped);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function resolveOpeningSquadFade(globalProgress: number): number {
  if (globalProgress < OPERATION_RAVENNA_GROUND_SPRINT_END) {
    return 0;
  }

  const revealSpan = 0.018;
  const start = OPERATION_RAVENNA_GROUND_SPRINT_END;

  if (globalProgress >= start + revealSpan) {
    return 1;
  }

  return smoothstep((globalProgress - start) / revealSpan);
}

function offsetFromKeyframe(
  frame: SquadOffsetKeyframe,
  localT: number,
): SquadMemberOffset {
  let forward = frame.forward;
  let lateral = frame.lateral;
  let vertical = frame.vertical;
  let visibility = frame.visibility ?? 1;

  if (frame.kind === 'overtake') {
    const surge = Math.sin(localT * Math.PI) * 0.85;
    forward += surge;
    vertical += surge * 0.15;
  }

  if (frame.kind === 'crossFront') {
    lateral += Math.sin(localT * Math.PI) * 2.4;
    forward += Math.sin(localT * Math.PI) * 1.2;
  }

  if (frame.kind === 'occluded') {
    const dip = Math.sin(localT * Math.PI);
    vertical -= dip * 1.35;
    forward -= dip * 0.6;
    visibility *= 0.22 + dip * 0.18;
  }

  return {
    forward,
    lateral,
    vertical,
    visibility,
  };
}

/** Resolves scripted maneuver offsets for one squad member (test and debug helper). */
export function resolveSquadManeuverOffset(
  member: SquadMemberId,
  choreographyProgress: SquadTraversalProgress,
): SquadMemberOffset {
  return resolveManeuverOffset(getSquadMemberKeyframes(member), choreographyProgress);
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

    if (!next || clamped < frame.end - span * 0.18) {
      return current;
    }

    const blendT = smoothstep((clamped - (frame.end - span * 0.18)) / (span * 0.18));
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

function forwardMetersToAerialDelta(forwardMeters: number): number {
  if (ROOFTOPS_PATH_LENGTH_METERS <= 0) {
    return 0;
  }

  return (forwardMeters / ROOFTOPS_PATH_LENGTH_METERS) * ROOFTOPS_CAMERA_SPAN;
}

function sampleAerialPathFrame(globalProgress: number, out: MutablePathFrame): void {
  const aerialProgress = mapGlobalProgressToAerialOdm(globalProgress);
  const epsilon = 0.004;
  const nextAerial = Math.min(1, aerialProgress + epsilon);
  const prevAerial = Math.max(0, aerialProgress - epsilon);

  resolveRooftopTraversalPose(aerialProgress, scratchPose);
  resolveRooftopTraversalPose(nextAerial, scratchNextPose);
  resolveRooftopTraversalPose(prevAerial, scratchPrevPose);

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
}

/**
 * Resolves a squad member world pose during the existing rooftop traversal segment.
 */
export function resolveSquadMemberPose(
  member: SquadMemberId,
  globalProgress: number,
  out: Vector3,
): SquadMemberPose {
  const choreographyProgress = resolveSquadChoreographyProgress(globalProgress);
  const keyframes = getSquadMemberKeyframes(member);
  const offset = resolveManeuverOffset(keyframes, choreographyProgress);
  const fade = resolveOpeningSquadFade(globalProgress);

  const cameraProgress = rooftopsTraversalToCameraProgress(choreographyProgress);
  const memberAerialProgress = clampTimelineProgress(
    cameraProgress + forwardMetersToAerialDelta(offset.forward),
  );

  sampleAerialPathFrame(memberAerialProgress, {
    position: scratchPosition,
    forward: scratchForward,
    lateral: scratchLateral,
  });

  out
    .copy(scratchPosition)
    .addScaledVector(scratchLateral, offset.lateral)
    .addScaledVector(WORLD_UP, offset.vertical);

  const yaw = Math.atan2(scratchForward.x, scratchForward.z);
  const pitch = Math.atan2(
    scratchForward.y,
    Math.hypot(scratchForward.x, scratchForward.z),
  );

  return {
    position: [out.x, out.y, out.z],
    rotation: [pitch * 0.35, yaw, offset.lateral * -0.04],
    visibility: clampTimelineProgress(offset.visibility * fade),
  };
}

/** Resolves bride and groom poses for the squad traversal sequence. */
export function resolveSquadTraversal(globalProgress: number): SquadTraversalState {
  const progress = resolveSquadChoreographyProgress(globalProgress);
  const bridePosition = new Vector3();
  const groomPosition = new Vector3();

  return {
    progress,
    bride: resolveSquadMemberPose('bride', globalProgress, bridePosition),
    groom: resolveSquadMemberPose('groom', globalProgress, groomPosition),
  };
}

/** Resolves squad traversal from global hero scroll progress. */
export function resolveSquadTraversalFromGlobal(globalProgress: number): SquadTraversalState {
  return resolveSquadTraversal(globalProgress);
}
