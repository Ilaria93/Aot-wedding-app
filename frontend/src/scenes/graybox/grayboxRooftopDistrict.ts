import { FLIGHT_CORRIDOR_PATH } from '@/data/flightCorridorPath';
import type {
  GrayboxBuildingSpec,
  GrayboxCorridorStripSpec,
  GrayboxRooftopFeatureSpec,
  GrayboxRooftopShape,
  GrayboxStreetSpec,
  GrayboxTone,
} from '@/scenes/graybox/types';

export type RooftopDistrictLayout = {
  buildings: readonly GrayboxBuildingSpec[];
  features: readonly GrayboxRooftopFeatureSpec[];
  streets: readonly GrayboxStreetSpec[];
  corridorStrips: readonly GrayboxCorridorStripSpec[];
  ground: {
    position: [number, number, number];
    size: [number, number];
  };
};

const STREET_WIDTH_X = 7;
const STREET_WIDTH_Z = 8;
const LOT_WIDTH = 9;
const LOT_DEPTH = 11;
const FLIGHT_CORRIDOR_RADIUS = 11;
const DISTRICT_MIN_X = -18;
const DISTRICT_MAX_X = 72;
const DISTRICT_MAX_Z = 8;
const DISTRICT_MIN_Z = -78;

/** Deterministic pseudo-random in [0, 1) from grid coordinates. */
export function rooftopGridHash(row: number, col: number): number {
  const mixed = (row * 73856093) ^ (col * 19349663);
  return ((mixed >>> 0) % 1000) / 1000;
}

/** Building height with wide variation — low blocks to landmark towers. */
export function rooftopLotHeight(row: number, col: number): number {
  const roll = rooftopGridHash(row, col);

  if (roll < 0.4) {
    return 4 + (row % 5) * 1.5 + (col % 3) * 0.9;
  }

  if (roll < 0.78) {
    return 10 + (row % 6) * 2.1 + (col % 4) * 1.2;
  }

  return 20 + (row % 4) * 3 + (col % 3) * 2;
}

function rooftopLotShape(row: number, col: number): GrayboxRooftopShape {
  const roll = rooftopGridHash(col + 3, row + 7);

  if (roll < 0.22) {
    return 'stepped';
  }

  if (roll < 0.42) {
    return 'lShape';
  }

  if (roll < 0.58) {
    return 'tower';
  }

  return 'box';
}

function rooftopLotTone(row: number, col: number): GrayboxTone {
  const roll = rooftopGridHash(col, row);

  if (roll < 0.34) {
    return 'structure';
  }

  if (roll < 0.67) {
    return 'structureAlt';
  }

  return 'structureDark';
}

function distancePointToSegmentXZ(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
): number {
  const dx = bx - ax;
  const dz = bz - az;
  const lengthSq = dx * dx + dz * dz;

  if (lengthSq < 1e-6) {
    return Math.hypot(px - ax, pz - az);
  }

  const t = Math.min(1, Math.max(0, ((px - ax) * dx + (pz - az) * dz) / lengthSq));
  const closestX = ax + t * dx;
  const closestZ = az + t * dz;

  return Math.hypot(px - closestX, pz - closestZ);
}

/** Distance from a lot center to the rooftops camera path projected on the XZ plane. */
export function distanceToRooftopsFlightPath(x: number, z: number): number {
  let minDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < FLIGHT_CORRIDOR_PATH.length - 1; index += 1) {
    const from = FLIGHT_CORRIDOR_PATH[index];
    const to = FLIGHT_CORRIDOR_PATH[index + 1];
    const distance = distancePointToSegmentXZ(x, z, from.x, from.z, to.x, to.z);
    minDistance = Math.min(minDistance, distance);
  }

  return minDistance;
}

function isFlightCorridor(x: number, z: number): boolean {
  return distanceToRooftopsFlightPath(x, z) < FLIGHT_CORRIDOR_RADIUS;
}

function lotToBuilding(
  row: number,
  col: number,
  minX: number,
  minZ: number,
): GrayboxBuildingSpec {
  const height = rooftopLotHeight(row, col);
  const centerX = minX + LOT_WIDTH / 2;
  const centerZ = minZ - LOT_DEPTH / 2;

  return {
    id: `roof-block-${row}-${col}`,
    position: [centerX, height / 2, centerZ],
    size: [LOT_WIDTH, height, LOT_DEPTH],
    tone: rooftopLotTone(row, col),
    shape: rooftopLotShape(row, col),
    roofTone: rooftopGridHash(row + 11, col + 5) < 0.68 ? 'clay' : 'darkClay',
  };
}

function rooftopFeatureForBuilding(
  building: GrayboxBuildingSpec,
  row: number,
  col: number,
): GrayboxRooftopFeatureSpec[] {
  const [x, y, z] = building.position;
  const [width, height, depth] = building.size;
  const roofY = y + height / 2;
  const features: GrayboxRooftopFeatureSpec[] = [];
  const roll = rooftopGridHash(row + 19, col + 23);

  if (height > 7 && roll < 0.72) {
    features.push({
      id: `${building.id}-chimney`,
      kind: 'chimney',
      position: [x - width * 0.28, roofY + 1.1, z + depth * 0.22],
      size: [0.9, 2.2, 0.9],
    });
  }

  if (height > 8 && rooftopGridHash(row + 41, col + 17) < 0.55) {
    features.push({
      id: `${building.id}-roof-window`,
      kind: 'roofWindow',
      position: [x + width * 0.18, roofY + 0.72, z - depth * 0.2],
      size: [2.2, 1.15, 1.35],
      rotationY: rooftopGridHash(row + 7, col + 31) < 0.5 ? 0 : Math.PI / 2,
    });
  }

  if (building.shape === 'tower' && height > 18) {
    features.push({
      id: `${building.id}-bell-tower`,
      kind: 'bellTower',
      position: [x, roofY + 3.7, z],
      size: [width * 0.52, 7.4, depth * 0.52],
    });
  }

  return features;
}

function courtyardFeature(
  row: number,
  col: number,
  x: number,
  z: number,
): GrayboxRooftopFeatureSpec | null {
  if ((row + col) % 4 !== 1) {
    return null;
  }

  return {
    id: `courtyard-${row}-${col}`,
    kind: 'courtyard',
    position: [x, 0.075, z],
    size: [LOT_WIDTH * 0.9, 0.15, LOT_DEPTH * 0.8],
  };
}

function buildStreetGrid(): GrayboxStreetSpec[] {
  const streets: GrayboxStreetSpec[] = [];

  for (let x = DISTRICT_MIN_X; x <= DISTRICT_MAX_X; x += LOT_WIDTH + STREET_WIDTH_X) {
    const centerX = x + STREET_WIDTH_X / 2 + LOT_WIDTH / 2;
    streets.push({
      position: [centerX, 0.03, (DISTRICT_MAX_Z + DISTRICT_MIN_Z) / 2],
      size: [STREET_WIDTH_X, DISTRICT_MAX_Z - DISTRICT_MIN_Z + LOT_DEPTH],
    });
  }

  for (let z = DISTRICT_MAX_Z; z >= DISTRICT_MIN_Z; z -= LOT_DEPTH + STREET_WIDTH_Z) {
    const centerZ = z - STREET_WIDTH_Z / 2 - LOT_DEPTH / 2;
    streets.push({
      position: [(DISTRICT_MIN_X + DISTRICT_MAX_X) / 2, 0.03, centerZ],
      size: [DISTRICT_MAX_X - DISTRICT_MIN_X + LOT_WIDTH, STREET_WIDTH_Z],
    });
  }

  return streets;
}

/** Builds visible corridor strips along the rooftops camera spline. */
export function buildFlightCorridorStrips(): GrayboxCorridorStripSpec[] {
  const strips: GrayboxCorridorStripSpec[] = [];

  for (let index = 0; index < FLIGHT_CORRIDOR_PATH.length - 1; index += 1) {
    const from = FLIGHT_CORRIDOR_PATH[index];
    const to = FLIGHT_CORRIDOR_PATH[index + 1];
    const midX = (from.x + to.x) / 2;
    const midZ = (from.z + to.z) / 2;
    const span = Math.hypot(to.x - from.x, to.z - from.z);
    const rotationY = Math.atan2(to.x - from.x, to.z - from.z);

    strips.push({
      position: [midX, 0.06, midZ],
      size: [FLIGHT_CORRIDOR_RADIUS * 2.1, span + 2],
      rotationY,
    });
  }

  return strips;
}

/**
 * Builds a structured rooftop district — varied shapes, streets and a marked flight corridor.
 */
export function buildRooftopDistrictLayout(): RooftopDistrictLayout {
  const buildings: GrayboxBuildingSpec[] = [];
  const features: GrayboxRooftopFeatureSpec[] = [];
  let row = 0;

  for (let z = DISTRICT_MAX_Z; z >= DISTRICT_MIN_Z; z -= LOT_DEPTH + STREET_WIDTH_Z) {
    let col = 0;

    for (let x = DISTRICT_MIN_X; x <= DISTRICT_MAX_X; x += LOT_WIDTH + STREET_WIDTH_X) {
      const lotMinX = x + STREET_WIDTH_X;
      const lotMinZ = z - STREET_WIDTH_Z;
      const centerX = lotMinX + LOT_WIDTH / 2;
      const centerZ = lotMinZ - LOT_DEPTH / 2;

      const isCorridorLot = isFlightCorridor(centerX, centerZ);
      const courtyard = isCorridorLot ? null : courtyardFeature(row, col, centerX, centerZ);

      if (courtyard) {
        features.push(courtyard);
      } else if (!isCorridorLot) {
        const building = lotToBuilding(row, col, lotMinX, lotMinZ);
        buildings.push(building);
        features.push(...rooftopFeatureForBuilding(building, row, col));
      }

      col += 1;
    }

    row += 1;
  }

  return {
    buildings,
    features,
    streets: buildStreetGrid(),
    corridorStrips: buildFlightCorridorStrips(),
    ground: {
      position: [(DISTRICT_MIN_X + DISTRICT_MAX_X) / 2, 0, (DISTRICT_MAX_Z + DISTRICT_MIN_Z) / 2],
      size: [DISTRICT_MAX_X - DISTRICT_MIN_X + 24, DISTRICT_MAX_Z - DISTRICT_MIN_Z + 24],
    },
  };
}

export const ROOFTOP_DISTRICT_LAYOUT = buildRooftopDistrictLayout();
