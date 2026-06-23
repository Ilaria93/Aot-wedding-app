import { Vector3 } from 'three';

/** Street takeoff — matches the end of `streetOpeningPath`. */
export const FLIGHT_CORRIDOR_STREET_LAUNCH = new Vector3(-1.2, 1.58, -4);

/** Approach point before the destination wall segment. */
export const FLIGHT_CORRIDOR_WALLS_APPROACH = new Vector3(38, 14, -104);

/**
 * Static rooftop flight corridor — shared by graybox district layout and ODM beats.
 * Kept dependency-free so district generation can run at module init.
 */
export function buildFlightCorridorPath(): Vector3[] {
  return [
    FLIGHT_CORRIDOR_STREET_LAUNCH.clone(),
    new Vector3(-4.5, 5.5, -6),
    new Vector3(-7.5, 11, -9),
    new Vector3(-5.5, 10.2, -12),
    new Vector3(2, 10.8, -17),
    new Vector3(9, 10, -22),
    new Vector3(8, 10.4, -42),
    new Vector3(23, 10, -67),
    new Vector3(32, 11.5, -97),
    FLIGHT_CORRIDOR_WALLS_APPROACH.clone(),
  ];
}

/** Read-only spine used by graybox corridor clearance checks. */
export const FLIGHT_CORRIDOR_PATH: readonly Vector3[] = buildFlightCorridorPath();
