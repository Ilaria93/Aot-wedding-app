import { GRAYBOX_PALETTE } from '@/constants/grayboxPalette';
import {
  OPENING_BELL_TOWER_POSITION,
  OPENING_HORIZON_WALL_POSITION,
  OPENING_HORIZON_WALL_SIZE,
  OPENING_PORTICO_COLUMN_SPACING,
  OPENING_PORTICO_OFFSET_X,
  OPENING_STREET_CENTER_X,
  OPENING_STREET_HALF_WIDTH,
  OPENING_STREET_Z_FAR,
  OPENING_STREET_Z_NEAR,
} from '@/scenes/graybox/openingEstablishingLayout';

const mat = { roughness: 0.94, metalness: 0 } as const;

type PorticoSideProps = {
  side: 'left' | 'right';
};

/** Repeating arcade columns and lintel along one side of the street. */
function PorticoColonnade({ side }: PorticoSideProps) {
  const sign = side === 'left' ? -1 : 1;
  const x = sign * OPENING_PORTICO_OFFSET_X;
  const columns: number[] = [];

  for (let z = OPENING_STREET_Z_NEAR; z >= OPENING_STREET_Z_FAR; z -= OPENING_PORTICO_COLUMN_SPACING) {
    columns.push(z);
  }

  return (
    <group name={`portico-${side}`}>
      {columns.map((z) => (
        <mesh key={`col-${z}`} castShadow receiveShadow position={[x, 2.05, z]}>
          <boxGeometry args={[0.55, 4.1, 0.55]} />
          <meshStandardMaterial color={GRAYBOX_PALETTE.porticoStone} {...mat} />
        </mesh>
      ))}

      <mesh castShadow receiveShadow position={[x, 4.15, (OPENING_STREET_Z_NEAR + OPENING_STREET_Z_FAR) / 2]}>
        <boxGeometry args={[0.75, 0.38, OPENING_STREET_Z_NEAR - OPENING_STREET_Z_FAR + 2]} />
        <meshStandardMaterial color={GRAYBOX_PALETTE.stuccoShadow} {...mat} />
      </mesh>

      <mesh receiveShadow position={[x, 4.55, (OPENING_STREET_Z_NEAR + OPENING_STREET_Z_FAR) / 2]}>
        <boxGeometry args={[2.8, 0.22, OPENING_STREET_Z_NEAR - OPENING_STREET_Z_FAR + 3.2]} />
        <meshStandardMaterial color={GRAYBOX_PALETTE.stuccoWarm} {...mat} />
      </mesh>
    </group>
  );
}

/** Mediterranean facades rising behind each portico. */
function StreetFacades({ side }: PorticoSideProps) {
  const sign = side === 'left' ? -1 : 1;
  const baseX = sign * (OPENING_PORTICO_OFFSET_X + 3.8);
  const blocks = [
    { z: 7, w: 5.5, h: 11, d: 8 },
    { z: -1, w: 6, h: 14, d: 9 },
    { z: -10, w: 5.8, h: 12.5, d: 8.5 },
    { z: -19, w: 6.2, h: 13.5, d: 9 },
  ];

  return (
    <group name={`facades-${side}`}>
      {blocks.map((block, index) => (
        <group key={`block-${side}-${index}`} position={[baseX, block.h / 2, block.z]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[block.w, block.h, block.d]} />
            <meshStandardMaterial
              color={index % 2 === 0 ? GRAYBOX_PALETTE.stucco : GRAYBOX_PALETTE.stuccoWarm}
              {...mat}
            />
          </mesh>
          <mesh castShadow receiveShadow position={[0, block.h / 2 + 0.18, 0]}>
            <boxGeometry args={[block.w * 1.04, 0.35, block.d * 1.04]} />
            <meshStandardMaterial
              color={index % 2 === 0 ? GRAYBOX_PALETTE.terracotta : GRAYBOX_PALETTE.roofClay}
              {...mat}
            />
          </mesh>
          {index < 2 ? (
            <mesh position={[sign * -block.w * 0.32, -block.h * 0.15, block.d * 0.28]}>
              <boxGeometry args={[1.4, 2.4, 0.2]} />
              <meshStandardMaterial color={GRAYBOX_PALETTE.porticoShadow} {...mat} />
            </mesh>
          ) : null}
        </group>
      ))}
    </group>
  );
}

/** Romanesque campanile — focal landmark at the vanishing point. */
function LandmarkBellTower() {
  const [x, , z] = OPENING_BELL_TOWER_POSITION;

  return (
    <group name="landmark-bell-tower" position={[x, 0, z]}>
      <mesh castShadow receiveShadow position={[0, 3.5, 0]}>
        <boxGeometry args={[7.5, 7, 7.5]} />
        <meshStandardMaterial color={GRAYBOX_PALETTE.stucco} {...mat} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 12, 0]}>
        <boxGeometry args={[5.2, 10, 5.2]} />
        <meshStandardMaterial color={GRAYBOX_PALETTE.stuccoWarm} {...mat} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 19.5, 0]}>
        <boxGeometry args={[6.4, 3.2, 6.4]} />
        <meshStandardMaterial color={GRAYBOX_PALETTE.porticoStone} {...mat} />
      </mesh>

      {[-1.4, 1.4].map((ox) => (
        <mesh key={`arch-${ox}`} position={[ox, 18.8, 2.4]}>
          <boxGeometry args={[1.5, 2.8, 0.35]} />
          <meshStandardMaterial color={GRAYBOX_PALETTE.porticoShadow} {...mat} />
        </mesh>
      ))}

      <mesh castShadow receiveShadow position={[0, 24.5, 0]}>
        <coneGeometry args={[3.8, 7.5, 4]} />
        <meshStandardMaterial color={GRAYBOX_PALETTE.terracottaDark} {...mat} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 28.8, 0]}>
        <sphereGeometry args={[0.55, 8, 8]} />
        <meshStandardMaterial color={GRAYBOX_PALETTE.terracotta} {...mat} />
      </mesh>
    </group>
  );
}

/** Wall mass on the horizon — mission scale hinted through fog. */
function HorizonWallSilhouette() {
  const [x, y, z] = OPENING_HORIZON_WALL_POSITION;
  const [w, h, d] = OPENING_HORIZON_WALL_SIZE;

  return (
    <group name="horizon-wall-hint">
      <mesh receiveShadow position={[x, y, z]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={GRAYBOX_PALETTE.wall} {...mat} />
      </mesh>
      <mesh receiveShadow position={[x, y + h / 2 + 2, z - d / 2 - 0.8]}>
        <boxGeometry args={[w * 0.94, 3.5, 2.2]} />
        <meshStandardMaterial color={GRAYBOX_PALETTE.wallCrest} {...mat} />
      </mesh>
      <mesh receiveShadow position={[x, y * 0.42, z + 10]}>
        <boxGeometry args={[w * 0.7, h * 0.35, 4]} />
        <meshStandardMaterial color={GRAYBOX_PALETTE.wall} {...mat} />
      </mesh>
    </group>
  );
}

/** Cobbled street with a subtle center perspective line. */
function StreetSurface() {
  const length = OPENING_STREET_Z_NEAR - OPENING_STREET_Z_FAR + 8;
  const centerZ = (OPENING_STREET_Z_NEAR + OPENING_STREET_Z_FAR) / 2;

  return (
    <group name="street-surface">
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[OPENING_STREET_CENTER_X, 0.02, centerZ]}>
        <planeGeometry args={[OPENING_STREET_HALF_WIDTH * 2 + 1, length]} />
        <meshStandardMaterial color={GRAYBOX_PALETTE.cobblestone} {...mat} />
      </mesh>

      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[OPENING_STREET_CENTER_X, 0.025, centerZ]}>
        <planeGeometry args={[0.35, length * 0.92]} />
        <meshStandardMaterial color={GRAYBOX_PALETTE.cobblestoneLight} {...mat} />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, centerZ + 16]}>
        <planeGeometry args={[OPENING_PORTICO_OFFSET_X * 2 + 14, 34]} />
        <meshStandardMaterial color={GRAYBOX_PALETTE.ground} {...mat} />
      </mesh>
    </group>
  );
}

/**
 * Static anime establishing shot — Ravenna portico street, campanile, walled horizon.
 * Composed for the fixed opening camera; no characters or ODM.
 */
export function GrayboxOpeningEstablishingShot() {
  return (
    <group name="graybox-opening-establishing">
      <StreetSurface />
      <PorticoColonnade side="left" />
      <PorticoColonnade side="right" />
      <StreetFacades side="left" />
      <StreetFacades side="right" />
      <LandmarkBellTower />
      <HorizonWallSilhouette />
    </group>
  );
}
