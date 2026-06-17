import { Vector3 } from 'three';

import { CAMERA_PATHS } from '@/data/cameraPaths';
import type { OdmAnchor, OdmAnchorSide, OdmCameraLeg } from '@/types/odmCamera';
import { buildOdmCameraLegs } from '@/utils/odmCameraMotion';

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
        segmentId: segment.id,
      });
    }
  }

  return anchors;
}

/** Pre-built anchor chain and scroll legs for the Operation Ravenna hero camera. */
export const ODM_CAMERA_ANCHORS: readonly OdmAnchor[] = buildOdmAnchorsFromCameraPaths();

export const ODM_CAMERA_LEGS: readonly OdmCameraLeg[] = buildOdmCameraLegs(ODM_CAMERA_ANCHORS);
