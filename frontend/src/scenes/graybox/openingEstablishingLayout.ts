/**
 * Hand-authored layout for the static Operation Ravenna establishing frame.
 * Camera stands in a portico-lined street looking toward the city center and distant wall.
 */

/** Fixed eye position — street level inside the portico corridor. */
export const OPENING_ESTABLISHING_CAMERA_POSITION: [number, number, number] = [
  0, 1.62, 10,
];

/** Look target — vanishing point toward the bell tower and walled horizon. */
export const OPENING_ESTABLISHING_CAMERA_TARGET: [number, number, number] = [
  0.5, 17, -38,
];

/** Narrower FOV for anime-style perspective compression on the first frame. */
export const OPENING_ESTABLISHING_CAMERA_FOV = 54;

/** Main street axis (center line). */
export const OPENING_STREET_CENTER_X = 0;

/** Half-width of the cobbled carriageway. */
export const OPENING_STREET_HALF_WIDTH = 5.2;

/** Portico colonnade offset from street center. */
export const OPENING_PORTICO_OFFSET_X = 6.4;

/** Column spacing along the street (meters). */
export const OPENING_PORTICO_COLUMN_SPACING = 3.1;

/** Z extent of the playable establishing set. */
export const OPENING_STREET_Z_NEAR = 12;
export const OPENING_STREET_Z_FAR = -22;

/** Landmark bell tower anchor at the end of the visible vista. */
export const OPENING_BELL_TOWER_POSITION: [number, number, number] = [1.2, 0, -28];

/** Distant wall silhouette — barely visible through morning fog. */
export const OPENING_HORIZON_WALL_POSITION: [number, number, number] = [4, 26, -62];
export const OPENING_HORIZON_WALL_SIZE: [number, number, number] = [140, 52, 6];
