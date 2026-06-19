import { CatmullRomCurve3, Vector3 } from 'three';

import type { CameraPathSegmentDefinition } from '@/types/cameraPathEditor';
import {
  OPENING_ESTABLISHING_CAMERA_POSITION,
  OPENING_ESTABLISHING_CAMERA_TARGET,
} from '@/scenes/graybox/openingEstablishingLayout';

/** Static opening + ground sprint — street-level run toward the first hook point. */
export const streetOpeningPath = [
  new Vector3(...OPENING_ESTABLISHING_CAMERA_POSITION),
  new Vector3(-0.4, 1.64, 2),
  new Vector3(-0.8, 1.66, -8),
  new Vector3(-9.5, 1.72, -4),
];

export const streetOpeningTargetPath = [
  new Vector3(...OPENING_ESTABLISHING_CAMERA_TARGET),
  new Vector3(0.4, 15, -48),
  new Vector3(0.8, 12, -58),
  new Vector3(14, 18, -90),
];

export const streetOpeningCurve = new CatmullRomCurve3(streetOpeningPath);
export const streetOpeningTargetCurve = new CatmullRomCurve3(streetOpeningTargetPath);

/** Aerial rooftops — first ODM hook and swings toward the wall (after ground sprint). */
export const aerialRooftopsPath = [
  new Vector3(-9.5, 1.72, -4),
  new Vector3(-5, 7.5, -5),
  new Vector3(2, 13, -16),
  new Vector3(12, 7.4, -28),
  new Vector3(23, 15.5, -42),
  new Vector3(36, 8.2, -56),
  new Vector3(48, 17.5, -70),
  new Vector3(56, 11.5, -84),
  new Vector3(52, 18, -96),
  new Vector3(38, 14, -104),
];

export const aerialRooftopsTargetPath = [
  new Vector3(-3, 3, -12),
  new Vector3(4, 5.5, -20),
  new Vector3(14, 7, -32),
  new Vector3(26, 5.8, -46),
  new Vector3(38, 7.8, -60),
  new Vector3(50, 6.4, -74),
  new Vector3(58, 9, -88),
  new Vector3(54, 8, -100),
  new Vector3(42, 10, -110),
  new Vector3(30, 12, -116),
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
    end: 0.09,
    positionPoints: streetOpeningPath,
    targetPoints: streetOpeningTargetPath,
    path: streetOpeningCurve,
    targetPath: streetOpeningTargetCurve,
  },
  {
    id: 'rooftops',
    start: 0.09,
    end: 0.42,
    positionPoints: aerialRooftopsPath,
    targetPoints: aerialRooftopsTargetPath,
    path: aerialRooftopsCurve,
    targetPath: aerialRooftopsTargetCurve,
  },
  {
    id: 'giantWalls',
    start: 0.42,
    end: 0.6,
    positionPoints: giantWallsPath,
    targetPoints: giantWallsTargetPath,
    path: giantWallsCurve,
    targetPath: giantWallsTargetCurve,
  },
  {
    id: 'titanCorridor',
    start: 0.6,
    end: 0.84,
    positionPoints: titanCorridorPath,
    targetPoints: titanCorridorTargetPath,
    path: titanCorridorCurve,
    targetPath: titanCorridorTargetCurve,
  },
  {
    id: 'finalArena',
    start: 0.84,
    end: 1,
    positionPoints: finalArenaPath,
    targetPoints: finalArenaTargetPath,
    path: finalArenaCurve,
    targetPath: finalArenaTargetCurve,
  },
] as const;
