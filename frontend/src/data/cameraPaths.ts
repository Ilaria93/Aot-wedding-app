import { CatmullRomCurve3, Vector3 } from 'three';

import type { CameraPathSegmentDefinition } from '@/types/cameraPathEditor';
import {
  buildFinalArenaOdmPath,
  buildGiantWallOdmPath,
  buildTitanCorridorOdmPath,
} from '@/data/odmWorldAnchors';
import {
  buildAerialRooftopPathKeyframes,
  buildRooftopFlightCorridorPath,
} from '@/data/rooftopTraversalBeats';
import {
  OPERATION_RAVENNA_GROUND_SPRINT_END,
  OPERATION_RAVENNA_ROOFTOPS_END,
  OPERATION_RAVENNA_TITAN_CORRIDOR_END,
  OPERATION_RAVENNA_WALL_LAUNCH_END,
} from '@/constants/operationRavennaOpening';
import {
  OPENING_ESTABLISHING_CAMERA_POSITION,
  OPENING_ESTABLISHING_CAMERA_TARGET,
  OPENING_FOOTPATH_RUN_POINTS,
} from '@/scenes/graybox/openingEstablishingLayout';

/** Builds look-at targets ahead and slightly below each path control point. */
function buildPathLookTargets(path: readonly Vector3[], lookAhead = 1.8, lookDown = 2.6): Vector3[] {
  return path.map((point, index) => {
    const next = path[index + 1] ?? point;
    const forwardX = next.x - point.x;
    const forwardZ = next.z - point.z;
    const length = Math.hypot(forwardX, forwardZ) || 1;

    return new Vector3(
      point.x + (forwardX / length) * lookAhead,
      point.y - lookDown,
      point.z + (forwardZ / length) * lookAhead,
    );
  });
}

/** Footpath sprint — countryside trail (lower-left) into the Ravenna street. */
export const streetOpeningPath = OPENING_FOOTPATH_RUN_POINTS.map(
  ([x, y, z]) => new Vector3(x, y, z),
);

export const streetOpeningTargetPath = buildPathLookTargets(streetOpeningPath, 2.2, 2.4);

export const streetOpeningCurve = new CatmullRomCurve3(streetOpeningPath);
export const streetOpeningTargetCurve = new CatmullRomCurve3(streetOpeningTargetPath);

/** Aerial rooftops — sparse corridor spine for graybox clearance and path editor. */
export const aerialRooftopsPath = buildRooftopFlightCorridorPath();

/** Full beat keyframes for debug / previs overlays. */
export const aerialRooftopsBeatPath = buildAerialRooftopPathKeyframes();

export const aerialRooftopsTargetPath = buildPathLookTargets(aerialRooftopsPath);

export const aerialRooftopsCurve = new CatmullRomCurve3(aerialRooftopsPath);
export const aerialRooftopsTargetCurve = new CatmullRomCurve3(aerialRooftopsTargetPath);

/** @deprecated Use aerialRooftopsPath — kept for flight-corridor layout helpers. */
export const rooftopsPath = aerialRooftopsPath;

/** @deprecated Use aerialRooftopsTargetPath */
export const rooftopsTargetPath = aerialRooftopsTargetPath;

export const rooftopsCurve = aerialRooftopsCurve;
export const rooftopsTargetCurve = aerialRooftopsTargetCurve;

/** Giant wall — hooks on the destination wall face, climb in open air beside the volume. */
export const giantWallsPath = buildGiantWallOdmPath();

export const giantWallsTargetPath = buildPathLookTargets(giantWallsPath, 2.2, 3.2);

export const giantWallsCurve = new CatmullRomCurve3(giantWallsPath);
export const giantWallsTargetCurve = new CatmullRomCurve3(giantWallsTargetPath);

/** Outside the wall — weave between graybox titan silhouettes with shoulder-level hooks. */
export const titanCorridorPath = buildTitanCorridorOdmPath();

export const titanCorridorTargetPath = buildPathLookTargets(titanCorridorPath, 2.4, 2.2);

export const titanCorridorCurve = new CatmullRomCurve3(titanCorridorPath);
export const titanCorridorTargetCurve = new CatmullRomCurve3(titanCorridorTargetPath);

/** Final strike — climb above the arena platform toward the countdown cut. */
export const finalArenaPath = buildFinalArenaOdmPath();

export const finalArenaTargetPath = buildPathLookTargets(finalArenaPath, 1.6, 4);

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
