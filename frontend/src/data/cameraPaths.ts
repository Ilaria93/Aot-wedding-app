import { CatmullRomCurve3, Vector3 } from 'three';

import type { CameraPathSegmentDefinition } from '@/types/cameraPathEditor';
import {
  OPERATION_RAVENNA_GROUND_SPRINT_END,
  OPERATION_RAVENNA_ROOFTOPS_END,
  OPERATION_RAVENNA_TITAN_CORRIDOR_END,
  OPERATION_RAVENNA_WALL_LAUNCH_END,
} from '@/constants/operationRavennaOpening';
import {
  OPENING_ESTABLISHING_CAMERA_POSITION,
  OPENING_ESTABLISHING_CAMERA_TARGET,
} from '@/scenes/graybox/openingEstablishingLayout';

/** Short sprint from the outskirts to the first hook — two scroll beats max. */
export const streetOpeningPath = [
  new Vector3(...OPENING_ESTABLISHING_CAMERA_POSITION),
  new Vector3(0.04, 1.48, 46),
  new Vector3(-0.15, 1.5, 22),
  new Vector3(-9.5, 1.58, -4),
];

export const streetOpeningTargetPath = [
  new Vector3(...OPENING_ESTABLISHING_CAMERA_TARGET),
  new Vector3(0.1, 4, 30),
  new Vector3(0.25, 5.5, 8),
  new Vector3(-8, 9, -6),
];

export const streetOpeningCurve = new CatmullRomCurve3(streetOpeningPath);
export const streetOpeningTargetCurve = new CatmullRomCurve3(streetOpeningTargetPath);

/** Aerial rooftops — lift above roofs, then soft left/right swings between rows. */
export const aerialRooftopsPath = [
  new Vector3(-9.5, 1.58, -4),
  new Vector3(-11.5, 6.8, -7),
  new Vector3(-5.5, 10.2, -12),
  new Vector3(2, 10.8, -17),
  new Vector3(9, 10, -22),
  new Vector3(14, 10.5, -27),
  new Vector3(6, 10.2, -32),
  new Vector3(15, 9.8, -37),
  new Vector3(8, 10.4, -42),
  new Vector3(17, 10, -47),
  new Vector3(11, 10.3, -52),
  new Vector3(20, 9.9, -57),
  new Vector3(14, 10.2, -62),
  new Vector3(23, 10, -67),
  new Vector3(17, 10.4, -72),
  new Vector3(26, 10.1, -77),
  new Vector3(20, 10.6, -82),
  new Vector3(29, 10.3, -87),
  new Vector3(24, 11, -92),
  new Vector3(32, 11.5, -97),
  new Vector3(38, 14, -104),
];

export const aerialRooftopsTargetPath = [
  new Vector3(-8, 3.5, -6),
  new Vector3(-9, 5.5, -9),
  new Vector3(-4, 7.2, -13),
  new Vector3(1, 7.5, -18),
  new Vector3(8, 7, -23),
  new Vector3(12, 7.4, -28),
  new Vector3(5, 7.2, -33),
  new Vector3(13, 6.8, -38),
  new Vector3(7, 7.1, -43),
  new Vector3(15, 6.9, -48),
  new Vector3(9, 7.2, -53),
  new Vector3(17, 6.8, -58),
  new Vector3(11, 7, -63),
  new Vector3(19, 6.8, -68),
  new Vector3(13, 7.1, -73),
  new Vector3(21, 6.9, -78),
  new Vector3(16, 7.2, -83),
  new Vector3(24, 6.9, -88),
  new Vector3(19, 7.2, -93),
  new Vector3(27, 7, -98),
  new Vector3(32, 8, -108),
];

export const aerialRooftopsCurve = new CatmullRomCurve3(aerialRooftopsPath);
export const aerialRooftopsTargetCurve = new CatmullRomCurve3(aerialRooftopsTargetPath);

/** @deprecated Use aerialRooftopsPath — kept for flight-corridor layout helpers. */
export const rooftopsPath = aerialRooftopsPath;

/** @deprecated Use aerialRooftopsTargetPath */
export const rooftopsTargetPath = aerialRooftopsTargetPath;

export const rooftopsCurve = aerialRooftopsCurve;
export const rooftopsTargetCurve = aerialRooftopsTargetCurve;

/** Giant wall — final approach, vertical climb, edge run to the right, then leap outside. */
export const giantWallsPath = [
  new Vector3(38, 14, -104),
  new Vector3(30, 26, -108),
  new Vector3(27, 48, -111),
  new Vector3(29, 76, -113),
  new Vector3(33, 104, -115),
  new Vector3(48, 106, -116),
  new Vector3(64, 103, -122),
  new Vector3(58, 94, -138),
];

export const giantWallsTargetPath = [
  new Vector3(30, 22, -112),
  new Vector3(28, 48, -113),
  new Vector3(28, 74, -116),
  new Vector3(34, 101, -118),
  new Vector3(50, 104, -120),
  new Vector3(70, 100, -132),
  new Vector3(58, 82, -150),
  new Vector3(44, 64, -162),
];

export const giantWallsCurve = new CatmullRomCurve3(giantWallsPath);
export const giantWallsTargetCurve = new CatmullRomCurve3(giantWallsTargetPath);

/** Outside the wall — forest dive, giant near-misses and a teammate overtake. */
export const titanCorridorPath = [
  new Vector3(58, 94, -138),
  new Vector3(38, 58, -158),
  new Vector3(18, 24, -176),
  new Vector3(-8, 13, -190),
  new Vector3(16, 21, -208),
  new Vector3(38, 12, -224),
  new Vector3(10, 18, -238),
  new Vector3(-18, 12, -252),
  new Vector3(0, 24, -266),
  new Vector3(20, 18, -278),
];

export const titanCorridorTargetPath = [
  new Vector3(40, 70, -160),
  new Vector3(20, 38, -178),
  new Vector3(-8, 15, -196),
  new Vector3(18, 12, -212),
  new Vector3(42, 14, -226),
  new Vector3(12, 10, -242),
  new Vector3(-16, 12, -256),
  new Vector3(0, 18, -270),
  new Vector3(18, 20, -282),
  new Vector3(26, 28, -292),
];

export const titanCorridorCurve = new CatmullRomCurve3(titanCorridorPath);
export const titanCorridorTargetCurve = new CatmullRomCurve3(titanCorridorTargetPath);

/** Final strike — climb a giant, teammates flank the POV and blind-cut to the countdown. */
export const finalArenaPath = [
  new Vector3(20, 18, -278),
  new Vector3(16, 28, -286),
  new Vector3(10, 42, -292),
  new Vector3(5, 58, -296),
  new Vector3(1, 72, -300),
  new Vector3(0, 82, -304),
];

export const finalArenaTargetPath = [
  new Vector3(16, 30, -286),
  new Vector3(10, 44, -292),
  new Vector3(5, 60, -297),
  new Vector3(1, 74, -302),
  new Vector3(0, 82, -308),
  new Vector3(0, 84, -314),
];

export const finalArenaCurve = new CatmullRomCurve3(finalArenaPath);
export const finalArenaTargetCurve = new CatmullRomCurve3(finalArenaTargetPath);

/**
 * Operation Ravenna camera paths — edit Vector3 control points here during previs.
 * Each segment exposes pre-built CatmullRomCurve3 instances for CameraRig and helpers.
 */
export const CAMERA_PATHS: readonly CameraPathSegmentDefinition[] = [
  {
    id: 'streetOpening',
    start: 0,
    end: OPERATION_RAVENNA_GROUND_SPRINT_END,
    positionPoints: streetOpeningPath,
    targetPoints: streetOpeningTargetPath,
    path: streetOpeningCurve,
    targetPath: streetOpeningTargetCurve,
  },
  {
    id: 'rooftops',
    start: OPERATION_RAVENNA_GROUND_SPRINT_END,
    end: OPERATION_RAVENNA_ROOFTOPS_END,
    positionPoints: aerialRooftopsPath,
    targetPoints: aerialRooftopsTargetPath,
    path: aerialRooftopsCurve,
    targetPath: aerialRooftopsTargetCurve,
  },
  {
    id: 'giantWalls',
    start: OPERATION_RAVENNA_ROOFTOPS_END,
    end: OPERATION_RAVENNA_WALL_LAUNCH_END,
    positionPoints: giantWallsPath,
    targetPoints: giantWallsTargetPath,
    path: giantWallsCurve,
    targetPath: giantWallsTargetCurve,
  },
  {
    id: 'titanCorridor',
    start: OPERATION_RAVENNA_WALL_LAUNCH_END,
    end: OPERATION_RAVENNA_TITAN_CORRIDOR_END,
    positionPoints: titanCorridorPath,
    targetPoints: titanCorridorTargetPath,
    path: titanCorridorCurve,
    targetPath: titanCorridorTargetCurve,
  },
  {
    id: 'finalArena',
    start: OPERATION_RAVENNA_TITAN_CORRIDOR_END,
    end: 1,
    positionPoints: finalArenaPath,
    targetPoints: finalArenaTargetPath,
    path: finalArenaCurve,
    targetPath: finalArenaTargetCurve,
  },
] as const;
