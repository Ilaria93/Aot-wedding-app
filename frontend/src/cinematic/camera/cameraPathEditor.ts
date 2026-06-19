import { CatmullRomCurve3, type Vector3 } from 'three';

import { CAMERA_PATHS } from '@/data/cameraPaths';
import type { CameraPathEditorSpline, CameraPathSegmentDefinition } from '@/types/cameraPathEditor';
import type { CameraTimeline } from '@/types/cameraRig';

export type CameraPathSegmentState = {
  segmentName: string;
  localProgress: number;
};

/** Default polyline resolution for visualizing Catmull-Rom splines. */
export const CAMERA_PATH_SPLINE_DIVISIONS = 64;

/** Builds a Catmull-Rom spline from editable Vector3 control points. */
export function createCameraCatmullRomCurve(points: Vector3[]): CatmullRomCurve3 {
  return new CatmullRomCurve3(points);
}

/** Samples a spline into a polyline for helper line rendering. */
export function sampleCatmullRomPolyline(
  curve: CatmullRomCurve3,
  divisions: number = CAMERA_PATH_SPLINE_DIVISIONS,
): Vector3[] {
  const samples: Vector3[] = [];

  for (let index = 0; index <= divisions; index += 1) {
    samples.push(curve.getPoint(index / divisions));
  }

  return samples;
}

/** Builds the scroll-driven camera timeline from code-editable path definitions. */
export function buildCameraTimelineFromPathDefinitions(
  definitions: readonly CameraPathSegmentDefinition[],
): CameraTimeline {
  return {
    segments: definitions.map((definition) => ({
      start: definition.start,
      end: definition.end,
      path: definition.path,
      targetPath: definition.targetPath,
    })),
  };
}

/** Resolves editor splines for dev helper rendering. */
export function resolveCameraPathEditorSplines(
  definitions: readonly CameraPathSegmentDefinition[],
): CameraPathEditorSpline[] {
  return definitions.map((definition) => ({
    id: definition.id,
    positionPoints: definition.positionPoints,
    targetPoints: definition.targetPoints,
    positionCurve: definition.path,
    targetCurve: definition.targetPath,
  }));
}

/** Maps global scroll progress to the active camera path segment and local factor. */
export function resolveCurrentCameraPathSegment(globalProgress: number): CameraPathSegmentState {
  const clamped = Math.min(1, Math.max(0, globalProgress));
  const lastIndex = CAMERA_PATHS.length - 1;

  for (let index = 0; index < CAMERA_PATHS.length; index += 1) {
    const segment = CAMERA_PATHS[index];
    const isLast = index === lastIndex;
    const isInside =
      clamped >= segment.start && (clamped < segment.end || (isLast && clamped <= segment.end));

    if (!isInside) {
      continue;
    }

    const span = Math.max(segment.end - segment.start, 1e-6);
    return {
      segmentName: segment.id,
      localProgress: (clamped - segment.start) / span,
    };
  }

  return { segmentName: CAMERA_PATHS[0]?.id ?? 'rooftops', localProgress: 0 };
}
