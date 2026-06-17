import { CatmullRomCurve3, Vector3 } from 'three';

import type { CameraPathSegmentDefinition } from '@/types/cameraPathEditor';

/** Rooftops — rooftop-to-rooftop launches with vertical momentum and lateral hooks. */
export const rooftopsPath = [
  new Vector3(0, 5, 0),
  new Vector3(2, 4.2, -3),
  new Vector3(7, 8.5, -8),
  new Vector3(13, 3.8, -14),
  new Vector3(19, 10.5, -20),
  new Vector3(26, 4.5, -27),
  new Vector3(33, 12.5, -34),
  new Vector3(40, 5, -41),
  new Vector3(47, 11.5, -48),
  new Vector3(53, 4.8, -56),
  new Vector3(58, 9.5, -64),
  new Vector3(60, 12, -70),
];

export const rooftopsTargetPath = [
  new Vector3(0, 2, -8),
  new Vector3(4, 2.5, -12),
  new Vector3(10, 3, -18),
  new Vector3(16, 2, -24),
  new Vector3(22, 3.5, -32),
  new Vector3(30, 2.5, -40),
  new Vector3(38, 3, -48),
  new Vector3(46, 2.5, -56),
  new Vector3(52, 3.5, -64),
  new Vector3(58, 4, -72),
  new Vector3(62, 5, -78),
  new Vector3(65, 5, -85),
];

export const rooftopsCurve = new CatmullRomCurve3(rooftopsPath);
export const rooftopsTargetCurve = new CatmullRomCurve3(rooftopsTargetPath);

/** Giant walls — same six-beat structure with stronger vertical ascent and scale. */
export const giantWallsPath = [
  new Vector3(60, 12, -70),
  new Vector3(52, 20, -84),
  new Vector3(38, 13, -100),
  new Vector3(24, 26, -116),
  new Vector3(10, 14, -132),
  new Vector3(-6, 11, -155),
];

export const giantWallsTargetPath = [
  new Vector3(50, 6, -86),
  new Vector3(36, 8, -102),
  new Vector3(22, 6, -118),
  new Vector3(8, 7, -136),
  new Vector3(-6, 5, -152),
  new Vector3(-18, 4, -168),
];

export const giantWallsCurve = new CatmullRomCurve3(giantWallsPath);
export const giantWallsTargetCurve = new CatmullRomCurve3(giantWallsTargetPath);

/** Titan corridor — aggressive S-curves, lateral hooks and near-miss redirections. */
export const titanCorridorPath = [
  new Vector3(-6, 11, -155),
  new Vector3(-16, 8, -164),
  new Vector3(-20, 15, -176),
  new Vector3(-8, 9, -187),
  new Vector3(6, 16, -198),
  new Vector3(16, 10, -210),
  new Vector3(4, 14, -222),
  new Vector3(-10, 9, -232),
  new Vector3(2, 17, -238),
  new Vector3(18, 7, -242),
];

export const titanCorridorTargetPath = [
  new Vector3(-12, 4, -168),
  new Vector3(-14, 5, -180),
  new Vector3(-4, 4, -192),
  new Vector3(8, 5, -204),
  new Vector3(14, 4, -216),
  new Vector3(4, 4, -226),
  new Vector3(-6, 3, -234),
  new Vector3(6, 4, -240),
  new Vector3(16, 3, -246),
  new Vector3(22, 3, -252),
];

export const titanCorridorCurve = new CatmullRomCurve3(titanCorridorPath);
export const titanCorridorTargetCurve = new CatmullRomCurve3(titanCorridorTargetPath);

/** Final arena — placeholder descent into the end platform. */
export const finalArenaPath = [
  new Vector3(18, 7, -242),
  new Vector3(12, 11, -258),
  new Vector3(4, 6, -272),
  new Vector3(0, 9, -285),
  new Vector3(-2, 5, -296),
  new Vector3(0, 7, -305),
];

export const finalArenaTargetPath = [
  new Vector3(14, 3, -255),
  new Vector3(8, 3, -268),
  new Vector3(2, 2, -278),
  new Vector3(0, 2, -288),
  new Vector3(0, 2, -298),
  new Vector3(0, 2, -305),
];

export const finalArenaCurve = new CatmullRomCurve3(finalArenaPath);
export const finalArenaTargetCurve = new CatmullRomCurve3(finalArenaTargetPath);

/**
 * Operation Ravenna camera paths — edit Vector3 control points here during previs.
 * Each segment exposes pre-built CatmullRomCurve3 instances for CameraRig and helpers.
 */
export const CAMERA_PATHS: readonly CameraPathSegmentDefinition[] = [
  {
    id: 'rooftops',
    start: 0,
    end: 0.25,
    positionPoints: rooftopsPath,
    targetPoints: rooftopsTargetPath,
    path: rooftopsCurve,
    targetPath: rooftopsTargetCurve,
  },
  {
    id: 'giantWalls',
    start: 0.25,
    end: 0.5,
    positionPoints: giantWallsPath,
    targetPoints: giantWallsTargetPath,
    path: giantWallsCurve,
    targetPath: giantWallsTargetCurve,
  },
  {
    id: 'titanCorridor',
    start: 0.5,
    end: 0.75,
    positionPoints: titanCorridorPath,
    targetPoints: titanCorridorTargetPath,
    path: titanCorridorCurve,
    targetPath: titanCorridorTargetCurve,
  },
  {
    id: 'finalArena',
    start: 0.75,
    end: 1,
    positionPoints: finalArenaPath,
    targetPoints: finalArenaTargetPath,
    path: finalArenaCurve,
    targetPath: finalArenaTargetCurve,
  },
] as const;
