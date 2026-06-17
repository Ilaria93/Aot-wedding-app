import { GRAYBOX_PALETTE } from '@/constants/grayboxPalette';
import { GRAYBOX_DESTINATION_WALL } from '@/scenes/graybox/grayboxLayout';

/** Single massive destination wall dominating the horizon. */
export function GrayboxGiantWalls() {
  const [x, y, z] = GRAYBOX_DESTINATION_WALL.position;
  const [width, height, depth] = GRAYBOX_DESTINATION_WALL.size;

  return (
    <group name="graybox-destination-wall">
      <mesh receiveShadow position={[x, y, z]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={GRAYBOX_PALETTE.wall} roughness={1} metalness={0} />
      </mesh>

      <mesh receiveShadow position={[x, y + height / 2 + 2.5, z - depth / 2 - 1.2]}>
        <boxGeometry args={[width * 0.92, 4.5, 3]} />
        <meshStandardMaterial color={GRAYBOX_PALETTE.wallCrest} roughness={1} metalness={0} />
      </mesh>

      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[x, 0.02, z - depth / 2 - 18]}>
        <planeGeometry args={[width + 40, 50]} />
        <meshStandardMaterial color={GRAYBOX_PALETTE.street} roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}
