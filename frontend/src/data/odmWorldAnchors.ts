import { Vector3 } from 'three';

import {
  FLIGHT_CORRIDOR_STREET_LAUNCH,
  FLIGHT_CORRIDOR_WALLS_APPROACH,
  buildFlightCorridorPath,
} from '@/data/flightCorridorPath';
import {
  OPENING_FACADE_OFFSET_X,
  OPENING_STREET_FACADE_BLOCKS,
} from '@/scenes/graybox/openingEstablishingLayout';
import {
  GRAYBOX_DESTINATION_WALL,
  GRAYBOX_TITAN_SILHOUETTES,
} from '@/scenes/graybox/grayboxLayout';
import type { GrayboxBuildingSpec, GrayboxTitanSilhouetteSpec } from '@/scenes/graybox/types';
import type { OdmAnchorSide } from '@/types/odmCamera';
import type { RooftopPlatformSpec } from '@/types/rooftopTraversal';

const scratchFacade = new Vector3();
const scratchApex = new Vector3();

/** Titan shoulder height in world units (GrayboxGiantSilhouette WORLD_SCALE). */
const TITAN_SHOULDER_Y = 3.4;
const TITAN_HOOK_OUTWARD = 4.5;

/** Meters the camera path stays outside a building facade. */
const FACADE_CLEARANCE = 2.8;

/** Eye height above a rooftop surface (meters). */
export const ROOFTOP_EYE_OFFSET = 1.55;

export const ROOFTOP_STREET_LAUNCH = FLIGHT_CORRIDOR_STREET_LAUNCH;
export const ROOFTOP_WALLS_APPROACH = FLIGHT_CORRIDOR_WALLS_APPROACH;

function eyeOnRoof(x: number, surfaceY: number, z: number): Vector3 {
  return new Vector3(x, surfaceY + ROOFTOP_EYE_OFFSET, z);
}

/** Nearest opening-street facade block to a world Z coordinate. */
function resolveOpeningFacadeBlock(z: number) {
  let best = OPENING_STREET_FACADE_BLOCKS[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const block of OPENING_STREET_FACADE_BLOCKS) {
    const distance = Math.abs(block.z - z);

    if (distance < bestDistance) {
      bestDistance = distance;
      best = block;
    }
  }

  return best;
}

/** Hook on the left opening facade for the first street launch. */
export function buildStreetFirstHook(): Vector3 {
  const block = resolveOpeningFacadeBlock(-6);
  const facadeX = -OPENING_FACADE_OFFSET_X - block.w / 2;

  return new Vector3(facadeX, block.h - 1.2, block.z);
}

/** Outward-facing facade point on a graybox building toward a corridor sample. */
export function resolveBuildingFacadeHook(
  building: GrayboxBuildingSpec,
  toward: Vector3,
  out: Vector3 = scratchFacade,
): Vector3 {
  const [centerX, centerY, centerZ] = building.position;
  const [width, height] = building.size;
  const roofY = centerY + height / 2;
  const deltaX = toward.x - centerX;
  const deltaZ = toward.z - centerZ;

  if (Math.abs(deltaX) >= Math.abs(deltaZ)) {
    const faceX = deltaX >= 0 ? centerX + width / 2 : centerX - width / 2;
    out.set(faceX, roofY - 1.4, centerZ);
  } else {
    const faceZ = deltaZ >= 0 ? centerZ + building.size[2] / 2 : centerZ - building.size[2] / 2;
    out.set(centerX, roofY - 1.4, faceZ);
  }

  return out;
}

function nearestDistrictBuilding(
  buildings: readonly GrayboxBuildingSpec[],
  x: number,
  z: number,
): GrayboxBuildingSpec | null {
  let best: GrayboxBuildingSpec | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const building of buildings) {
    const distance = Math.hypot(building.position[0] - x, building.position[2] - z);

    if (distance < bestDistance) {
      bestDistance = distance;
      best = building;
    }
  }

  return best;
}

function roofSurfaceY(building: GrayboxBuildingSpec): number {
  const centerY = building.position[1];
  const height = building.size[1];
  return centerY + height / 2;
}

function resolveHookSide(hookX: number, pathX: number): OdmAnchorSide {
  return hookX < pathX ? 'left' : 'right';
}

function swingApexBetween(from: Vector3, hook: Vector3, land: Vector3, out: Vector3): Vector3 {
  out.lerpVectors(hook, land, 0.45);
  out.y = Math.max(from.y, hook.y, land.y) + 2.8;
  return out;
}

/**
 * Rooftop platforms derived from graybox buildings + flight corridor landings.
 * Hooks sit on real facade corners; landings stay in the open corridor.
 */
export function buildGrayboxRooftopPlatforms(
  buildings: readonly GrayboxBuildingSpec[],
): readonly RooftopPlatformSpec[] {
  const landings = [
    { id: 'roof-entry', x: -5.5, z: -12 },
    { id: 'roof-mid', x: 9, z: -22 },
    { id: 'roof-deep', x: 8, z: -42 },
    { id: 'roof-wall-approach', x: 23, z: -67 },
  ] as const;

  const platforms: RooftopPlatformSpec[] = [];

  for (let index = 0; index < landings.length; index += 1) {
    const landing = landings[index];
    const building = nearestDistrictBuilding(buildings, landing.x, landing.z);

    if (!building) {
      continue;
    }

    const surfaceY = roofSurfaceY(building);
    const land = eyeOnRoof(landing.x, surfaceY, landing.z);
    const runA = eyeOnRoof(landing.x + (index % 2 === 0 ? 2.5 : -2.5), surfaceY, landing.z - 2.2);
    const runB = eyeOnRoof(landing.x + (index % 2 === 0 ? 5 : -3), surfaceY, landing.z - 4.5);
    const jumpOff = eyeOnRoof(land.x + (index % 2 === 0 ? 3 : -3), surfaceY, landing.z - 6);

    const nextLanding = landings[index + 1];
    const outboundTarget = nextLanding
      ? new Vector3(nextLanding.x, surfaceY, nextLanding.z)
      : ROOFTOP_WALLS_APPROACH.clone();
    const nextBuilding = nextLanding
      ? nearestDistrictBuilding(buildings, nextLanding.x, nextLanding.z)
      : null;
    const hookBuilding = nextBuilding ?? building;
    const outboundHook = resolveBuildingFacadeHook(hookBuilding, outboundTarget, new Vector3());
    const hookSide = resolveHookSide(outboundHook.x, land.x);
    const outboundSwingApex = swingApexBetween(land, outboundHook, eyeOnRoof(
      nextLanding?.x ?? 32,
      nextBuilding ? roofSurfaceY(nextBuilding) : surfaceY,
      nextLanding?.z ?? -97,
    ), new Vector3());

    const platform: RooftopPlatformSpec = {
      id: landing.id,
      surfaceY,
      land,
      runSteps: [runA, runB],
      jumpOff,
      outboundHook,
      outboundHookSide: hookSide,
      outboundSwingApex,
    };

    if (index === 0) {
      const streetHook = buildStreetFirstHook();
      const streetAir = ROOFTOP_STREET_LAUNCH.clone();
      streetAir.set(-4.5, 2.8, -5);
      platforms.push({
        ...platform,
        streetHook,
        streetHookSide: 'left',
        streetSwingApex: swingApexBetween(streetAir, streetHook, land, new Vector3()),
      });
    } else {
      platforms.push(platform);
    }
  }

  return platforms;
}

/** Front face Z of the destination wall (toward the approaching camera). */
export function resolveDestinationWallFaceZ(): number {
  const [, , centerZ] = GRAYBOX_DESTINATION_WALL.position;
  const [, , depth] = GRAYBOX_DESTINATION_WALL.size;
  return centerZ - depth / 2;
}

/** ODM hooks on the colossal wall — vertical climb then edge run. */
export function buildGiantWallOdmPath(): Vector3[] {
  const faceZ = resolveDestinationWallFaceZ();
  const [centerX, ,] = GRAYBOX_DESTINATION_WALL.position;
  const [, height] = GRAYBOX_DESTINATION_WALL.size;
  const topY = height - 2;

  return [
    ROOFTOP_WALLS_APPROACH.clone(),
    new Vector3(centerX - 8, 18, faceZ + FACADE_CLEARANCE),
    new Vector3(centerX - 4, 36, faceZ + FACADE_CLEARANCE),
    new Vector3(centerX, 58, faceZ + FACADE_CLEARANCE),
    new Vector3(centerX + 2, 78, faceZ + FACADE_CLEARANCE),
    new Vector3(centerX + 4, topY - 6, faceZ + FACADE_CLEARANCE),
    new Vector3(centerX + 18, topY - 2, faceZ + FACADE_CLEARANCE + 2),
    new Vector3(centerX + 32, topY - 8, faceZ + 12),
  ];
}

function titanShoulderHook(
  titan: GrayboxTitanSilhouetteSpec,
  pathBiasX: number,
  out: Vector3 = new Vector3(),
): Vector3 {
  const [x, , z] = titan.position;
  const outward = pathBiasX >= x ? 1 : -1;
  out.set(x + outward * TITAN_HOOK_OUTWARD, TITAN_SHOULDER_Y, z);
  return out;
}

/** Camera path weaving between graybox titans — hooks near shoulders, never through meshes. */
export function buildTitanCorridorOdmPath(): Vector3[] {
  const titans = GRAYBOX_TITAN_SILHOUETTES;
  const wallExit = buildGiantWallOdmPath();
  const start = wallExit[wallExit.length - 1]?.clone() ?? new Vector3(60, 96, -126);

  return [
    start,
    new Vector3(18, 62, -148),
    new Vector3(-4, 34, -168),
    new Vector3(20, 24, -182),
    new Vector3(-6, 20, -202),
    new Vector3(22, 18, -220),
    new Vector3(-4, 22, -238),
    new Vector3(14, 20, -258),
    new Vector3(6, 22, -276),
    new Vector3(20, 18, -278),
  ].map((point, index) => {
    if (index === 0 || index >= titans.length + 1) {
      return point;
    }

    const titan = titans[index - 1];
    const hook = titanShoulderHook(titan, point.x);
    return point.lerp(hook, 0.12);
  });
}

/** Final arena climb — open platform at path end. */
export function buildFinalArenaOdmPath(): Vector3[] {
  return [
    new Vector3(20, 18, -278),
    new Vector3(14, 32, -286),
    new Vector3(8, 48, -292),
    new Vector3(4, 64, -296),
    new Vector3(1, 78, -300),
    new Vector3(0, 88, -304),
  ];
}

/** Flight corridor spine — delegates to the shared static path. */
export function buildGrayboxFlightCorridorPath(): Vector3[] {
  return buildFlightCorridorPath();
}
