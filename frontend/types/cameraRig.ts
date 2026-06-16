import type { Curve, Vector3 } from 'three';

/** Normalized scroll progress in the range [0, 1]. */
export type NormalizedProgress = number;

/** Single camera motion segment along paired position and lookAt splines. */
export type CameraSegment = {
  readonly start: NormalizedProgress;
  readonly end: NormalizedProgress;
  readonly path: Curve<Vector3>;
  readonly targetPath: Curve<Vector3>;
};

/** Ordered timeline of camera segments covering the full scroll range. */
export type CameraTimeline = {
  readonly segments: readonly CameraSegment[];
};

/** Resolved camera pose sampled from spline curves. */
export type CameraPose = {
  readonly position: Vector3;
  readonly target: Vector3;
};

/** Active segment with its local interpolation factor. */
export type ActiveCameraSegment = {
  readonly segment: CameraSegment;
  readonly index: number;
  readonly localProgress: NormalizedProgress;
};
