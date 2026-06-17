import { ROOFTOP_DISTRICT_LAYOUT } from '@/utils/grayboxRooftopDistrict';

import type {
  GrayboxBoxSpec,
  GrayboxTitanSilhouetteSpec,
  GrayboxWallSpec,
} from '@/scenes/graybox/types';

export type {
  GrayboxBoxSpec,
  GrayboxBuildingSpec,
  GrayboxCapsuleSpec,
  GrayboxCorridorStripSpec,
  GrayboxStreetSpec,
  GrayboxTitanSilhouetteSpec,
  GrayboxWallSpec,
} from '@/scenes/graybox/types';

/** Structured rooftop district — city blocks, streets and flight corridor strips. */
export const GRAYBOX_ROOFTOP_BUILDINGS = ROOFTOP_DISTRICT_LAYOUT.buildings;

export const GRAYBOX_ROOFTOP_STREETS = ROOFTOP_DISTRICT_LAYOUT.streets;

export const GRAYBOX_ROOFTOP_CORRIDOR = ROOFTOP_DISTRICT_LAYOUT.corridorStrips;

export const GRAYBOX_ROOFTOP_GROUND = ROOFTOP_DISTRICT_LAYOUT.ground;

/**
 * One monumental wall — visible from rooftops on the horizon and dominant during approach.
 * Centered on the giant-walls / titan-corridor handoff (z ≈ -115).
 */
export const GRAYBOX_DESTINATION_WALL: GrayboxWallSpec = {
  position: [28, 52, -108],
  size: [200, 104, 14],
};

/** Titan corridor — low-poly humanoid silhouettes at colossal scale. */
export const GRAYBOX_TITAN_SILHOUETTES: readonly GrayboxTitanSilhouetteSpec[] = [
  {
    id: 'titan-left-ahead',
    position: [-32, 0, -162],
    rotationY: 0.45,
    scale: 1.05,
    armSpread: 0.2,
    torsoLean: 0.05,
  },
  {
    id: 'titan-right-mid',
    position: [30, 0, -178],
    rotationY: -2.75,
    scale: 1.15,
    armSpread: 0.14,
    torsoLean: -0.04,
  },
  {
    id: 'titan-right-rear',
    position: [34, 0, -218],
    rotationY: -2.4,
    scale: 1.1,
    armSpread: 0.18,
    torsoLean: -0.03,
  },
  {
    id: 'titan-left-rear',
    position: [-26, 0, -232],
    rotationY: 0.35,
    scale: 1.08,
    armSpread: 0.16,
    torsoLean: 0.04,
  },
];

export const GRAYBOX_CORRIDOR_GROUND = {
  position: [4, 0, -198] as const,
  size: [90, 100] as const,
};

/** Final arena — large open platform at the end of the camera path. */
export const GRAYBOX_ARENA_PLATFORM = {
  position: [0, 0.5, -290] as const,
  size: [90, 1, 90] as const,
};

export const GRAYBOX_ARENA_MARKERS: readonly GrayboxBoxSpec[] = [
  { position: [-28, 2, -275], size: [4, 4, 4], tone: 'structureAlt' },
  { position: [28, 2, -275], size: [4, 4, 4], tone: 'structureAlt' },
  { position: [-28, 2, -305], size: [4, 4, 4], tone: 'structureAlt' },
  { position: [28, 2, -305], size: [4, 4, 4], tone: 'structureAlt' },
];

/** @deprecated Use GRAYBOX_DESTINATION_WALL — kept for legacy imports. */
export const GRAYBOX_GIANT_WALLS: readonly GrayboxBoxSpec[] = [];

/** @deprecated Use GRAYBOX_ROOFTOP_GROUND */
export const GRAYBOX_WALLS_GROUND = {
  position: [28, 0, -108] as const,
  size: [220, 120] as const,
};

/** @deprecated Titans are now humanoid silhouettes */
export const GRAYBOX_TITAN_CAPSULES = [] as const;
