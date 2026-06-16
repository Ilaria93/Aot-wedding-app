import type { Vector3 } from 'three';

import type {
  ActiveCameraSegment,
  CameraPose,
  CameraSegment,
  CameraTimeline,
  NormalizedProgress,
} from '@/types/cameraRig';

type MutableCameraPose = {
  position: Vector3;
  target: Vector3;
};

/** Clamps a value to the normalized progress range [0, 1]. */
export function clampNormalizedProgress(value: number): NormalizedProgress {
  return Math.min(1, Math.max(0, value));
}

/** Maps global scroll progress to a local factor within a segment. */
export function toSegmentLocalProgress(
  segment: CameraSegment,
  progress: NormalizedProgress,
): NormalizedProgress {
  const span = segment.end - segment.start;
  if (span <= 0) {
    return 0;
  }

  return clampNormalizedProgress((progress - segment.start) / span);
}

/**
 * Finds the camera segment active at the given scroll progress.
 * Segments use half-open intervals [start, end), except the last segment which is inclusive on end.
 */
export function findActiveCameraSegment(
  timeline: CameraTimeline,
  progress: number,
): ActiveCameraSegment {
  const { segments } = timeline;

  if (segments.length === 0) {
    throw new Error('CameraTimeline requires at least one segment.');
  }

  const clamped = clampNormalizedProgress(progress);

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const isLast = index === segments.length - 1;
    const isActive =
      clamped >= segment.start && (clamped < segment.end || (isLast && clamped <= segment.end));

    if (isActive) {
      return {
        segment,
        index,
        localProgress: toSegmentLocalProgress(segment, clamped),
      };
    }
  }

  if (clamped < segments[0].start) {
    return {
      segment: segments[0],
      index: 0,
      localProgress: 0,
    };
  }

  const lastIndex = segments.length - 1;
  const lastSegment = segments[lastIndex];

  return {
    segment: lastSegment,
    index: lastIndex,
    localProgress: 1,
  };
}

/** Samples position and lookAt targets from the active segment splines. */
export function sampleCameraPose(
  segment: CameraSegment,
  localProgress: NormalizedProgress,
  out: MutableCameraPose,
): void {
  out.position.copy(segment.path.getPoint(localProgress));
  out.target.copy(segment.targetPath.getPoint(localProgress));
}

/**
 * Resolves the camera pose for a timeline at the given scroll progress.
 * Reuses the provided vectors to avoid per-frame allocations.
 */
export function resolveCameraPose(
  timeline: CameraTimeline,
  progress: number,
  out: MutableCameraPose,
): CameraPose {
  const active = findActiveCameraSegment(timeline, progress);
  sampleCameraPose(active.segment, active.localProgress, out);
  return out;
}

/** Validates segment ordering and bounds in development builds. */
export function assertValidCameraTimeline(timeline: CameraTimeline): void {
  const { segments } = timeline;

  if (segments.length === 0) {
    throw new Error('CameraTimeline requires at least one segment.');
  }

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];

    if (segment.start >= segment.end) {
      throw new Error(
        `Camera segment ${index} has invalid bounds: start (${segment.start}) must be < end (${segment.end}).`,
      );
    }

    if (segment.start < 0 || segment.end > 1) {
      throw new Error(
        `Camera segment ${index} must stay within [0, 1]: got [${segment.start}, ${segment.end}].`,
      );
    }

    if (index > 0 && segment.start < segments[index - 1].start) {
      throw new Error(`Camera segments must be ordered by start time (issue at index ${index}).`);
    }
  }
}
