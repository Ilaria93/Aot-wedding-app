/** Placement config for one colossal silhouette flanking the hero camera path. */
export type TitanSilhouettePlacement = {
  id: string;
  position: [number, number, number];
  rotationY: number;
  scale: number;
  armSpread: number;
  torsoLean: number;
};

/**
 * Four abstract giants positioned around the scroll-driven camera corridor.
 * Deliberately generic blocky forms — no franchise-specific anatomy.
 */
export const TITAN_CORRIDOR_SILHOUETTES: TitanSilhouettePlacement[] = [
  {
    id: 'flank-left-ahead',
    position: [-7.5, 0, 9.5],
    rotationY: 0.35,
    scale: 1.05,
    armSpread: 0.18,
    torsoLean: 0.04,
  },
  {
    id: 'flank-right-mid',
    position: [8.2, 0, 5.8],
    rotationY: -2.65,
    scale: 0.95,
    armSpread: 0.12,
    torsoLean: -0.03,
  },
  {
    id: 'flank-left-close',
    position: [-6.8, 0, 3.2],
    rotationY: 0.55,
    scale: 1.1,
    armSpread: 0.22,
    torsoLean: 0.06,
  },
  {
    id: 'flank-right-rear',
    position: [7.0, 0, 10.8],
    rotationY: -2.35,
    scale: 1.0,
    armSpread: 0.15,
    torsoLean: -0.02,
  },
];

/** Corridor wall segments framing the camera spline. */
export const TITAN_CORRIDOR_WALLS = [
  { position: [-4.2, 3.5, 7] as [number, number, number], size: [0.35, 7, 18] as [number, number, number] },
  { position: [4.2, 3.5, 7] as [number, number, number], size: [0.35, 7, 18] as [number, number, number] },
] as const;
