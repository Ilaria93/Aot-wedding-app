/** Temporary sandbox flag — toggles modular Ravenna GLB validation in the hero scene. */
export const RAVENNA_SANDBOX_ENABLED = true;

/** Returns whether the Ravenna sandbox should be mounted in the cinematic world. */
export function isRavennaSandboxEnabled(): boolean {
  return RAVENNA_SANDBOX_ENABLED;
}
