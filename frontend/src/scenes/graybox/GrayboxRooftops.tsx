import { GRAYBOX_PALETTE } from '@/constants/grayboxPalette';
import { GrayboxBuilding } from '@/scenes/graybox/GrayboxBuilding';
import {
  GRAYBOX_DESTINATION_WALL,
  GRAYBOX_ROOFTOP_BUILDINGS,
  GRAYBOX_ROOFTOP_CORRIDOR,
  GRAYBOX_ROOFTOP_GROUND,
  GRAYBOX_ROOFTOP_STREETS,
} from '@/scenes/graybox/grayboxLayout';

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
    </group>
  );
}
