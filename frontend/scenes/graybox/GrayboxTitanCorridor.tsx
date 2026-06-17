import { GRAYBOX_PALETTE } from '@/constants/grayboxPalette';
import { GrayboxGiantSilhouette } from '@/scenes/graybox/GrayboxGiantSilhouette';
import {
  GRAYBOX_CORRIDOR_GROUND,
  GRAYBOX_TITAN_SILHOUETTES,
} from '@/scenes/graybox/grayboxLayout';

/** Graybox titan corridor — giant humanoid silhouettes flanking the passage. */
export function GrayboxTitanCorridor() {
  return (
    <group name="graybox-titan-corridor">
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={GRAYBOX_CORRIDOR_GROUND.position}>
        <planeGeometry args={GRAYBOX_CORRIDOR_GROUND.size} />
        <meshStandardMaterial color={GRAYBOX_PALETTE.ground} roughness={1} metalness={0} />
      </mesh>

      {GRAYBOX_TITAN_SILHOUETTES.map((titan) => (
        <GrayboxGiantSilhouette key={titan.id} {...titan} />
      ))}
    </group>
  );
}
