import { GRAYBOX_PALETTE } from '@/constants/grayboxPalette';
import { GrayboxBuilding } from '@/scenes/graybox/GrayboxBuilding';
import {
  GRAYBOX_DESTINATION_WALL,
  GRAYBOX_ROOFTOP_BUILDINGS,
  GRAYBOX_ROOFTOP_CORRIDOR,
  GRAYBOX_ROOFTOP_FEATURES,
  GRAYBOX_ROOFTOP_GROUND,
  GRAYBOX_ROOFTOP_STREETS,
} from '@/scenes/graybox/grayboxLayout';
import type { GrayboxRooftopFeatureSpec } from '@/scenes/graybox/types';

const materialProps = { roughness: 1, metalness: 0 } as const;

function RooftopFeature({ feature }: { feature: GrayboxRooftopFeatureSpec }) {
  const rotationY = feature.rotationY ?? 0;

  if (feature.kind === 'chimney') {
    return (
      <mesh castShadow receiveShadow position={feature.position}>
        <boxGeometry args={feature.size} />
        <meshStandardMaterial color={GRAYBOX_PALETTE.structureDark} {...materialProps} />
      </mesh>
    );
  }

  if (feature.kind === 'roofWindow') {
    return (
      <group position={feature.position} rotation={[0, rotationY, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={feature.size} />
          <meshStandardMaterial color={GRAYBOX_PALETTE.roofWindow} {...materialProps} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, feature.size[1] * 0.18, 0]}>
          <boxGeometry args={[feature.size[0] * 1.12, feature.size[1] * 0.18, feature.size[2] * 1.12]} />
          <meshStandardMaterial color={GRAYBOX_PALETTE.roofClayDark} {...materialProps} />
        </mesh>
      </group>
    );
  }

  if (feature.kind === 'bellTower') {
    const [width, height, depth] = feature.size;
    const shaftH = height * 0.68;

    return (
      <group position={feature.position}>
        <mesh castShadow receiveShadow position={[0, -height * 0.16, 0]}>
          <boxGeometry args={[width, shaftH, depth]} />
          <meshStandardMaterial color={GRAYBOX_PALETTE.structure} {...materialProps} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, height * 0.28, 0]}>
          <boxGeometry args={[width * 1.25, height * 0.18, depth * 1.25]} />
          <meshStandardMaterial color={GRAYBOX_PALETTE.roofClay} {...materialProps} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, height * 0.46, 0]}>
          <coneGeometry args={[Math.max(width, depth) * 0.62, height * 0.28, 4]} />
          <meshStandardMaterial color={GRAYBOX_PALETTE.roofClayDark} {...materialProps} />
        </mesh>
      </group>
    );
  }

  return (
    <mesh receiveShadow position={feature.position}>
      <boxGeometry args={feature.size} />
      <meshStandardMaterial color={GRAYBOX_PALETTE.courtyard} roughness={1} metalness={0} />
    </mesh>
  );
}

/** Graybox rooftops — city blocks, streets and a marked flight corridor. */
export function GrayboxRooftops() {
  const [wallX, wallY, wallZ] = GRAYBOX_DESTINATION_WALL.position;
  const [wallW, wallH] = GRAYBOX_DESTINATION_WALL.size;

  return (
    <group name="graybox-rooftops">
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={GRAYBOX_ROOFTOP_GROUND.position}>
        <planeGeometry args={GRAYBOX_ROOFTOP_GROUND.size} />
        <meshStandardMaterial color={GRAYBOX_PALETTE.ground} roughness={1} metalness={0} />
      </mesh>

      <mesh receiveShadow position={[wallX, wallY * 0.55, wallZ + 24]}>
        <boxGeometry args={[wallW * 0.85, wallH * 0.55, 8]} />
        <meshStandardMaterial color={GRAYBOX_PALETTE.wall} roughness={1} metalness={0} />
      </mesh>

      {GRAYBOX_ROOFTOP_STREETS.map((street) => (
        <mesh
          key={`street-${street.position.join('-')}-${street.size.join('-')}`}
          receiveShadow
          rotation={[-Math.PI / 2, 0, 0]}
          position={street.position}>
          <planeGeometry args={street.size} />
          <meshStandardMaterial color={GRAYBOX_PALETTE.street} roughness={1} metalness={0} />
        </mesh>
      ))}

      {GRAYBOX_ROOFTOP_CORRIDOR.map((strip) => (
        <mesh
          key={`corridor-${strip.position.join('-')}-${strip.rotationY}`}
          receiveShadow
          rotation={[-Math.PI / 2, 0, strip.rotationY]}
          position={strip.position}>
          <planeGeometry args={strip.size} />
          <meshStandardMaterial color={GRAYBOX_PALETTE.corridor} roughness={1} metalness={0} />
        </mesh>
      ))}

      {GRAYBOX_ROOFTOP_BUILDINGS.map((building) => (
        <GrayboxBuilding
          key={`${building.shape}-${building.position.join('-')}-${building.size.join('-')}`}
          building={building}
        />
      ))}

      {GRAYBOX_ROOFTOP_FEATURES.map((feature) => (
        <RooftopFeature key={feature.id} feature={feature} />
      ))}
    </group>
  );
}
