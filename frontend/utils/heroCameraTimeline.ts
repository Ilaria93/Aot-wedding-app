import { CatmullRomCurve3, Vector3 } from 'three';

import type { CameraTimeline } from '@/types/cameraRig';

const rooftopsPath = new CatmullRomCurve3([
  new Vector3(0, 4.2, 11),
  new Vector3(0, 3.8, 9),
  new Vector3(0, 3.2, 7),
]);

const rooftopsTarget = new CatmullRomCurve3([
  new Vector3(0, 1.2, 0),
  new Vector3(0, 1.1, 0),
  new Vector3(0, 1, 0),
]);

const giantWallsPath = new CatmullRomCurve3([
  new Vector3(0, 3.2, 7),
  new Vector3(-1.5, 2.8, 5.5),
  new Vector3(-2.8, 2.4, 4),
]);

const giantWallsTarget = new CatmullRomCurve3([
  new Vector3(0, 1, 0),
  new Vector3(-0.5, 1, -0.5),
  new Vector3(-1, 1, -1),
]);

const titanCorridorPath = new CatmullRomCurve3([
  new Vector3(-2.8, 2.4, 4),
  new Vector3(-0.8, 2.8, 2),
  new Vector3(0.8, 3.2, 0),
]);

const titanCorridorTarget = new CatmullRomCurve3([
  new Vector3(-1, 1, -1),
  new Vector3(0, 1.2, 0),
  new Vector3(0, 1.2, 0),
]);

const finalArenaPath = new CatmullRomCurve3([
  new Vector3(0.8, 3.2, 0),
  new Vector3(1.8, 2.8, 3),
  new Vector3(0, 2.4, 6),
]);

const finalArenaTarget = new CatmullRomCurve3([
  new Vector3(0, 1.2, 0),
  new Vector3(0, 1, 0),
  new Vector3(0, 1, 0),
]);

/** Default hero scroll timeline aligned with the four placeholder environments. */
export const HERO_CAMERA_TIMELINE: CameraTimeline = {
  segments: [
    { start: 0, end: 0.25, path: rooftopsPath, targetPath: rooftopsTarget },
    { start: 0.25, end: 0.5, path: giantWallsPath, targetPath: giantWallsTarget },
    { start: 0.5, end: 0.75, path: titanCorridorPath, targetPath: titanCorridorTarget },
    { start: 0.75, end: 1, path: finalArenaPath, targetPath: finalArenaTarget },
  ],
};
