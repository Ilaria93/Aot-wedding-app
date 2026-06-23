import { Vector3 } from 'three';

import { setGrappleCableTarget } from '@/cinematic/camera/cameraMotion';
import {
  buildOdmCameraLegs,
  clampOdmProgress,
  DEFAULT_ODM_CAMERA_TUNING,
  findActiveOdmLeg,
  resolveOdmCameraPose,
} from '@/cinematic/camera/odmCameraMotion';
import type { CameraPathSegmentId } from '@/constants/cameraPathEditorColors';
import {
  OPERATION_RAVENNA_ROOFTOPS_END,
  OPERATION_RAVENNA_TITAN_CORRIDOR_END,
  OPERATION_RAVENNA_WALL_LAUNCH_END,
} from '@/constants/operationRavennaOpening';
import { CAMERA_PATHS } from '@/data/cameraPaths';
import type { OdmAnchor, OdmAnchorSide, OdmCameraLeg, OdmCameraTuning, OdmGrapplePhase } from '@/types/odmCamera';

type MutableSegmentOdmPose = {
  position: Vector3;
  target: Vector3;
  roll: number;
  fov: number;
  phase: OdmGrapplePhase;
};

type PostRooftopSegmentConfig = {
  readonly segmentId: CameraPathSegmentId;
  readonly start: number;
  readonly end: number;
  readonly tuning: OdmCameraTuning;
};

/** Wit-style wall climb — heavy vertical pull along the colossal wall. */
export const GIANT_WALL_ODM_TUNING: OdmCameraTuning = {
  ...DEFAULT_ODM_CAMERA_TUNING,
  gravitySag: 3.4,
  overshootRatio: 0.12,
  pullExponent: 2.9,
  lateralSwing: 1.35,
  pullPhaseEnd: 0.8,
  swingRoll: 0.11,
  rollIntensity: 0.7,
  baseFov: 62,
  maxFov: 76,
};

/**
 * Forest titan weave — snappy release/pull/redirect like the Barricades AMV montage.
 * High lateral swing, strong banking on overshoot, speed FOV widens on fast chords.
 */
export const TITAN_CORRIDOR_ODM_TUNING: OdmCameraTuning = {
  ...DEFAULT_ODM_CAMERA_TUNING,
  gravitySag: 5.2,
  overshootRatio: 0.22,
  pullExponent: 3.9,
  lateralSwing: 3.4,
  cableWobble: 0.12,
  pullPhaseEnd: 0.72,
  swingRoll: 0.17,
  rollIntensity: 1.1,
  redirectOvershoot: 1.24,
  baseFov: 64,
  maxFov: 80,
  fovSpeedAtMax: 55,
};

/** Final giant climb — committed upward pull with controlled overshoot. */
export const FINAL_ARENA_ODM_TUNING: OdmCameraTuning = {
  ...DEFAULT_ODM_CAMERA_TUNING,
  gravitySag: 4,
  overshootRatio: 0.14,
  pullExponent: 3.1,
  lateralSwing: 2.1,
  pullPhaseEnd: 0.76,
  swingRoll: 0.13,
  rollIntensity: 0.85,
  baseFov: 63,
  maxFov: 75,
};

const POST_ROOFTOP_SEGMENTS: readonly PostRooftopSegmentConfig[] = [
  {
    segmentId: 'giantWalls',
    start: OPERATION_RAVENNA_ROOFTOPS_END,
    end: OPERATION_RAVENNA_WALL_LAUNCH_END,
    tuning: GIANT_WALL_ODM_TUNING,
  },
  {
    segmentId: 'titanCorridor',
    start: OPERATION_RAVENNA_WALL_LAUNCH_END,
    end: OPERATION_RAVENNA_TITAN_CORRIDOR_END,
    tuning: TITAN_CORRIDOR_ODM_TUNING,
  },
  {
    segmentId: 'finalArena',
    start: OPERATION_RAVENNA_TITAN_CORRIDOR_END,
    end: 1,
    tuning: FINAL_ARENA_ODM_TUNING,
  },
] as const;

function resolveAnchorSide(index: number): OdmAnchorSide {
  return index % 2 === 0 ? 'right' : 'left';
}

/** Builds ODM hook anchors from one camera path segment's control points. */
export function buildSegmentOdmAnchors(segmentId: CameraPathSegmentId): OdmAnchor[] {
  const segment = CAMERA_PATHS.find((entry) => entry.id === segmentId);

  if (!segment) {
    return [];
  }

  return segment.positionPoints.map((point, index) => ({
    id: `${segmentId}-hook-${index}`,
    position: point.clone(),
    side: resolveAnchorSide(index),
    segmentId,
  }));
}

function buildSegmentLegsMap(): Record<CameraPathSegmentId, OdmCameraLeg[]> {
  const legs: Partial<Record<CameraPathSegmentId, OdmCameraLeg[]>> = {};

  for (const config of POST_ROOFTOP_SEGMENTS) {
    legs[config.segmentId] = buildOdmCameraLegs(buildSegmentOdmAnchors(config.segmentId));
  }

  return legs as Record<CameraPathSegmentId, OdmCameraLeg[]>;
}

const SEGMENT_ODM_LEGS = buildSegmentLegsMap();

/** Whether scroll progress is in a post-rooftop ODM segment (walls, titans, finale). */
export function isPostRooftopOdmPhase(globalProgress: number): boolean {
  return globalProgress >= OPERATION_RAVENNA_ROOFTOPS_END;
}

/** Whether the titan forest weave segment is active. */
export function isTitanCorridorOdmPhase(globalProgress: number): boolean {
  return (
    globalProgress >= OPERATION_RAVENNA_WALL_LAUNCH_END &&
    globalProgress < OPERATION_RAVENNA_TITAN_CORRIDOR_END
  );
}

/** Resolves the post-rooftop segment config for global hero progress. */
export function resolvePostRooftopSegment(
  globalProgress: number,
): PostRooftopSegmentConfig {
  const clamped = clampOdmProgress(globalProgress);

  for (const segment of POST_ROOFTOP_SEGMENTS) {
    const isLast = segment.end >= 1;
    const isActive =
      clamped >= segment.start && (clamped < segment.end || (isLast && clamped <= segment.end));

    if (isActive) {
      return segment;
    }
  }

  return POST_ROOFTOP_SEGMENTS[POST_ROOFTOP_SEGMENTS.length - 1];
}

/** Maps global hero progress to segment-local ODM progress [0, 1]. */
export function mapGlobalProgressToSegmentOdm(
  globalProgress: number,
  segment: PostRooftopSegmentConfig = resolvePostRooftopSegment(globalProgress),
): number {
  const span = segment.end - segment.start;

  if (span <= 0) {
    return 0;
  }

  return clampOdmProgress((clampOdmProgress(globalProgress) - segment.start) / span);
}

/**
 * Resolves Wit-style ODM camera pose for giant walls, titan corridor and final arena.
 * Each path control point is a grapple hook; legs use release → pull → overshoot.
 */
export function resolveHeroSegmentOdmPose(
  globalProgress: number,
  out: MutableSegmentOdmPose,
): void {
  const segment = resolvePostRooftopSegment(globalProgress);
  const legs = SEGMENT_ODM_LEGS[segment.segmentId];

  if (!legs.length) {
    return;
  }

  const localProgress = mapGlobalProgressToSegmentOdm(globalProgress, segment);
  resolveOdmCameraPose(legs, localProgress, out, segment.tuning);

  const active = findActiveOdmLeg(legs, localProgress);
  setGrappleCableTarget(true, active.leg.to.position, active.leg.to.side);
}

/** ODM legs for a post-rooftop segment — exposed for tests and dev overlays. */
export function getSegmentOdmLegs(segmentId: CameraPathSegmentId): readonly OdmCameraLeg[] {
  return SEGMENT_ODM_LEGS[segmentId] ?? [];
}
