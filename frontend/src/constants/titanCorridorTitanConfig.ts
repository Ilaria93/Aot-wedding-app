export type BullTerrierTitanPlacement = {
  position: [number, number, number];
  rotationY: number;
  /** Target height in world meters once scaled. */
  targetHeightMeters: number;
};

/**
 * Primary corridor obstacle — flanks the titan-corridor camera spline near z ≈ -198.
 * Positioned left of the flight path for a near-miss colossal silhouette.
 */
export const BULL_TERRIER_TITAN_PLACEMENT: BullTerrierTitanPlacement = {
  position: [-36, 0, -196],
  rotationY: 0.52,
  targetHeightMeters: 50,
};
