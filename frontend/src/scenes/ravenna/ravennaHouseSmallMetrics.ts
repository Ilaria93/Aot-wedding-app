/** Measured bounding box of `house_small.glb` in model space (meters). */
export const RAVENNA_HOUSE_SMALL_MODEL_FLOOR_Y = -0.818;
export const RAVENNA_HOUSE_SMALL_MODEL_HEIGHT = 1.632;

/** Target height aligned with the shortest establishing-shot facade block. */
export const RAVENNA_HOUSE_SMALL_TARGET_HEIGHT = 11;

/** Uniform scale mapping the GLB to graybox street proportions. */
export const RAVENNA_HOUSE_SMALL_WORLD_SCALE =
  RAVENNA_HOUSE_SMALL_TARGET_HEIGHT / RAVENNA_HOUSE_SMALL_MODEL_HEIGHT;

/** Lifts a scaled house so its lowest vertex rests on world Y = 0. */
export function resolveRavennaHouseSmallGroundY(scale: number): number {
  return -RAVENNA_HOUSE_SMALL_MODEL_FLOOR_Y * scale;
}

/** Resolves a placement scale multiplier to a uniform world scale. */
export function resolveRavennaHouseSmallScale(scaleMultiplier: number): number {
  return RAVENNA_HOUSE_SMALL_WORLD_SCALE * scaleMultiplier;
}
