import type { Vector3 } from 'three';

import type { CameraPathSegmentId } from '@/constants/cameraPathEditorColors';

/** Lateral hook side for alternating ODM grapple anchors. */
export type OdmAnchorSide = 'left' | 'right';

/** Grappling hook anchor the camera accelerates toward. */
export type OdmAnchor = {
  readonly id: string;
  readonly position: Vector3;
  readonly side: OdmAnchorSide;
  readonly segmentId: CameraPathSegmentId;
};

/** Scroll-weighted leg between two consecutive ODM anchors. */
export type OdmCameraLeg = {
  readonly from: OdmAnchor;
  readonly to: OdmAnchor;
  readonly start: number;
  readonly end: number;
  readonly chordLength: number;
};

/** Tunable ODM momentum feel — acceleration, overshoot, gravity and cable slack. */
export type OdmCameraTuning = {
  readonly gravitySag: number;
  readonly overshootRatio: number;
  readonly pullExponent: number;
  readonly lateralSwing: number;
  readonly cableWobble: number;
  readonly releasePhaseEnd: number;
  readonly pullPhaseEnd: number;
  readonly releaseGravityBoost: number;
  readonly rollIntensity: number;
  readonly swingRoll: number;
  readonly redirectOvershoot: number;
  readonly baseFov: number;
  readonly maxFov: number;
  readonly fovSpeedAtMax: number;
};

/** Grapple beat within a single anchor-to-anchor leg. */
export type OdmGrapplePhase = 'release' | 'pull' | 'overshoot';

/** Resolved ODM camera frame — position, aim, banking and suggested FOV. */
export type OdmCameraFrame = {
  readonly position: Vector3;
  readonly target: Vector3;
  readonly roll: number;
  readonly fov: number;
  readonly phase: OdmGrapplePhase;
};
