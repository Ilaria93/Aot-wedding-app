import { Vector3 } from 'three';

const prevPosition = new Vector3();
const prevVelocity = new Vector3();
const velocity = new Vector3();
const acceleration = new Vector3();

let trackingInitialized = false;

/** Per-frame camera kinematics shared across cinematic effects. */
export type CameraMotionSnapshot = {
  readonly velocity: Vector3;
  readonly acceleration: Vector3;
  speed: number;
  accelMagnitude: number;
};

/** Mutable snapshot updated by {@link updateCameraMotion}. */
export const cameraMotionState: CameraMotionSnapshot = {
  velocity,
  acceleration,
  speed: 0,
  accelMagnitude: 0,
};

/**
 * Derives camera velocity and acceleration from positional deltas.
 * Call once per frame from the active camera rig.
 */
export function updateCameraMotion(position: Vector3, deltaSeconds: number): void {
  const safeDelta = Math.max(deltaSeconds, 1e-6);

  if (!trackingInitialized) {
    prevPosition.copy(position);
    trackingInitialized = true;
    return;
  }

  velocity.subVectors(position, prevPosition).divideScalar(safeDelta);
  acceleration.subVectors(velocity, prevVelocity).divideScalar(safeDelta);

  cameraMotionState.speed = velocity.length();
  cameraMotionState.accelMagnitude = acceleration.length();

  prevVelocity.copy(velocity);
  prevPosition.copy(position);
}

/** Resets motion tracking — useful when the camera teleports between segments. */
export function resetCameraMotionTracking(): void {
  trackingInitialized = false;
  velocity.set(0, 0, 0);
  acceleration.set(0, 0, 0);
  prevVelocity.set(0, 0, 0);
  cameraMotionState.speed = 0;
  cameraMotionState.accelMagnitude = 0;
}
