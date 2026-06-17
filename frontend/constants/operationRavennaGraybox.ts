/**
 * When enabled, Operation Ravenna uses world-space graybox geometry instead of GLTF
 * placeholders — for scale and camera-path validation only.
 */
export const OPERATION_RAVENNA_GRAYBOX_ENABLED = true;

/** Returns whether the cinematic hero should render the graybox world. */
export function isOperationRavennaGrayboxEnabled(): boolean {
  return OPERATION_RAVENNA_GRAYBOX_ENABLED;
}
