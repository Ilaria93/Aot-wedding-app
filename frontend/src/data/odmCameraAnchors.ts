import { Vector3 } from 'three';

import type { CameraPathSegmentId } from '@/constants/cameraPathEditorColors';
import { aerialRooftopsPath, CAMERA_PATHS } from '@/data/cameraPaths';
import type { OdmAnchor, OdmAnchorSide, OdmCameraLeg } from '@/types/odmCamera';
import { buildOdmCameraLegs } from '@/cinematic/camera/odmCameraMotion';

const ANCHOR_MERGE_EPSILON = 0.05;

function pointsNear(a: Vector3, b: Vector3): boolean {
  return a.distanceTo(b) < ANCHOR_MERGE_EPSILON;
}

function resolveAnchorSide(index: number): OdmAnchorSide {
  return index % 2 === 0 ? 'right' : 'left';
}

/**
 * Flattens editable camera path control points into alternating ODM grapple anchors.
 * Shared segment endpoints are merged once.
 */
export function buildOdmAnchorsFromCameraPaths(): OdmAnchor[] {
  const anchors: OdmAnchor[] = [];

  for (const segment of CAMERA_PATHS) {
    for (const point of segment.positionPoints) {
      const last = anchors[anchors.length - 1];

      if (last && pointsNear(last.position, point)) {
        continue;
      }

      anchors.push({
        id: `${segment.id}-${anchors.length}`,
        position: point.clone(),
        side: resolveAnchorSide(anchors.length),
        segmentId: segment.id as CameraPathSegmentId,
      });
    }
  }

  return anchors;
}

function buildAerialOdmAnchors(): OdmAnchor[] {
  const anchors: OdmAnchor[] = [];

  for (const point of aerialRooftopsPath) {
    const last = anchors[anchors.length - 1];

    if (last && pointsNear(last.position, point)) {
      continue;
    }

    anchors.push({
      id: `rooftops-${anchors.length}`,
      position: point.clone(),
      side: resolveAnchorSide(anchors.length),
      segmentId: 'rooftops' as CameraPathSegmentId,
    });
  }

  return anchors;
}

/** Full hero anchor chain (street + aerial) — used by dev path editor helpers. */
export const ODM_CAMERA_ANCHORS: readonly OdmAnchor[] = buildOdmAnchorsFromCameraPaths();

/** Aerial-only ODM anchors — active after the first rooftop launch. */
export const AERIAL_ODM_CAMERA_ANCHORS: readonly OdmAnchor[] = buildAerialOdmAnchors();

export const ODM_CAMERA_LEGS: readonly OdmCameraLeg[] = buildOdmCameraLegs(ODM_CAMERA_ANCHORS);

export const AERIAL_ODM_CAMERA_LEGS: readonly OdmCameraLeg[] = buildOdmCameraLegs(
  AERIAL_ODM_CAMERA_ANCHORS,
);
