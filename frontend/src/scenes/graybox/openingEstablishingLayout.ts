/**
 * Operation Ravenna opening layout — sprint start on the far outskirts of Ravenna.
 * Low camera, look-ahead down the street (AoT ground sprint reference).
 */

/** Sprint start — outskirts, low eye height, city deep ahead. */
export const OPENING_ESTABLISHING_CAMERA_POSITION: [number, number, number] = [
  0, 1.46, 68,
];

/** Look-ahead target — cobbles and facades rushing toward the vanishing point. */
export const OPENING_ESTABLISHING_CAMERA_TARGET: [number, number, number] = [
  0.1, 3.6, 44,
];

/** Wide FOV for speed and depth on the first sprint frame. */
export const OPENING_ESTABLISHING_CAMERA_FOV = 62;

/** Main street axis (center line). */
export const OPENING_STREET_CENTER_X = 0;

/** Half-width of the cobbled carriageway. */
export const OPENING_STREET_HALF_WIDTH = 5.2;

/** Portico colonnade offset from street center. */
export const OPENING_PORTICO_OFFSET_X = 6.4;

/** Distance from portico line to facade block center. */
export const OPENING_FACADE_INSET_X = 3.8;

/** Facade row center offset from street axis. */
export const OPENING_FACADE_OFFSET_X = OPENING_PORTICO_OFFSET_X + OPENING_FACADE_INSET_X;

/** Spacing between modular houses along the opening street (meters). */
export const OPENING_STREET_HOUSE_SPACING_Z = 11.5;

/** Column spacing along the street (meters). */
export const OPENING_PORTICO_COLUMN_SPACING = 3.1;

/** Z extent of the playable establishing set — long corridor into the city. */
export const OPENING_STREET_Z_NEAR = 70;
export const OPENING_STREET_Z_FAR = -72;

export type OpeningStreetFacadeBlock = {
  z: number;
  w: number;
  h: number;
  d: number;
};

/** Builds repeating facade volumes along the full opening street. */
export function buildOpeningStreetFacadeBlocks(): OpeningStreetFacadeBlock[] {
  const heights = [11, 13.5, 12, 14, 11.5, 13];
  const blocks: OpeningStreetFacadeBlock[] = [];
  let index = 0;

  for (
    let z = OPENING_STREET_Z_NEAR - 6;
    z >= OPENING_STREET_Z_FAR + 6;
    z -= OPENING_STREET_HOUSE_SPACING_Z
  ) {
    blocks.push({
      z,
      w: 5.4 + (index % 3) * 0.35,
      h: heights[index % heights.length],
      d: 7.8 + (index % 2) * 0.8,
    });
    index += 1;
  }

  return blocks;
}

/** Hand-placed facade volumes behind each portico (world-space meters). */
export const OPENING_STREET_FACADE_BLOCKS = buildOpeningStreetFacadeBlocks();

/** Landmark bell tower anchor at the end of the visible vista. */
export const OPENING_BELL_TOWER_POSITION: [number, number, number] = [1.2, 0, -58];

/** Distant wall silhouette — barely visible through morning fog. */
export const OPENING_HORIZON_WALL_POSITION: [number, number, number] = [4, 26, -95];
export const OPENING_HORIZON_WALL_SIZE: [number, number, number] = [140, 52, 6];
