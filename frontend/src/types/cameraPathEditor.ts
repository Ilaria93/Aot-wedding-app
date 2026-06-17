import type { CatmullRomCurve3, Vector3 } from 'three';

/** Code-editable camera spline segment for Operation Ravenna previs. */
export type CameraPathSegmentDefinition = {
  id: string;
  start: number;
  end: number;
  positionPoints: Vector3[];
  targetPoints: Vector3[];
  path: CatmullRomCurve3;
  targetPath: CatmullRomCurve3;
};

/** Resolved spline pair used by the path editor helpers. */
export type CameraPathEditorSpline = {
  id: string;
  positionPoints: Vector3[];
  targetPoints: Vector3[];
  positionCurve: CatmullRomCurve3;
  targetCurve: CatmullRomCurve3;
};
