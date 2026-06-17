/** Live camera snapshot published by CameraRig for the dev overlay. */
export type CinematicCameraDebugSnapshot = {
  position: [number, number, number];
  rotation: [number, number, number];
};

/** Creates an empty camera debug snapshot. */
export function createEmptyCameraDebugSnapshot(): CinematicCameraDebugSnapshot {
  return {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
  };
}
