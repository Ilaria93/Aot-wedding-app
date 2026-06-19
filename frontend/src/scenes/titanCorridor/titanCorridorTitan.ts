import type { Object3D } from 'three';
import { Box3 } from 'three';

export const TITAN_HEAD_TRACK_MAX_RADIANS = 0.26;

/** Picks an idle clip by name, falling back to the first available animation. */
export function resolveIdleAnimationName(clipNames: readonly string[]): string | null {
  const idleClip = clipNames.find((name) => /idle/i.test(name));
  return idleClip ?? clipNames[0] ?? null;
}

/** Uniform scale factor that maps a native model height to a target world height. */
export function computeUniformScaleForHeight(
  nativeHeight: number,
  targetHeightMeters: number,
): number {
  if (!Number.isFinite(nativeHeight) || nativeHeight <= 0) {
    return 1;
  }

  return targetHeightMeters / nativeHeight;
}

/** Measures the axis-aligned height of an object graph. */
export function measureObjectHeight(root: Object3D): number {
  const bounds = new Box3().setFromObject(root);
  return bounds.max.y - bounds.min.y;
}

/** World Y for the group root so scaled feet sit on `groundY`. */
export function resolveTitanGroundY(
  minY: number,
  uniformScale: number,
  groundY: number,
): number {
  return groundY - minY * uniformScale;
}

/** Clamps subtle head yaw/pitch offsets toward the player camera. */
export function clampHeadTrackingAngles(
  yaw: number,
  pitch: number,
  maxRadians: number = TITAN_HEAD_TRACK_MAX_RADIANS,
): { yaw: number; pitch: number } {
  return {
    yaw: Math.max(-maxRadians, Math.min(maxRadians, yaw)),
    pitch: Math.max(-maxRadians * 0.55, Math.min(maxRadians * 0.55, pitch)),
  };
}

const HEAD_NAME = /head/i;
const CHEST_NAME = /(spine|spine1|chest|torso|upper)/i;

/** Finds the first head bone or mesh in a skinned GLB hierarchy. */
export function findHeadNode(root: Object3D): Object3D | null {
  let match: Object3D | null = null;

  root.traverse((child) => {
    if (match) {
      return;
    }

    if (HEAD_NAME.test(child.name) && !/end|top|tip/i.test(child.name)) {
      match = child;
    }
  });

  return match;
}

/** Finds a chest/spine node used for slow breathing motion. */
export function findChestNode(root: Object3D): Object3D | null {
  let match: Object3D | null = null;

  root.traverse((child) => {
    if (match) {
      return;
    }

    if (CHEST_NAME.test(child.name)) {
      match = child;
    }
  });

  return match;
}

/** Slow breathing offset — subtle scale pulse on the chest. */
export function computeBreathingScale(elapsedSeconds: number, phase: number): number {
  return 1 + Math.sin(elapsedSeconds * 0.62 + phase) * 0.012;
}
