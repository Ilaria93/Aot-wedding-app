import { GRAYBOX_PALETTE } from '@/constants/grayboxPalette';
import type { GrayboxTitanSilhouetteSpec } from '@/scenes/graybox/types';

type GrayboxGiantSilhouetteProps = GrayboxTitanSilhouetteSpec;

const WORLD_SCALE = 7.2;

const TITAN_MATERIAL = {
  color: GRAYBOX_PALETTE.titan,
  roughness: 1,
  metalness: 0,
} as const;

/**
 * Low-poly humanoid colossus for graybox titan corridor — scale over detail.
 */
export function GrayboxGiantSilhouette({
  position,
  rotationY,
  scale,
  armSpread,
  torsoLean,
}: GrayboxGiantSilhouetteProps) {
  const unit = scale * WORLD_SCALE;

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={unit}>
      <mesh position={[0, 0.42, 0]} rotation={[0, 0, torsoLean]} castShadow>
        <boxGeometry args={[0.55, 0.5, 0.32]} />
        <meshStandardMaterial {...TITAN_MATERIAL} />
      </mesh>

      <mesh position={[0, 0.78, 0.02]} castShadow>
        <boxGeometry args={[0.28, 0.28, 0.26]} />
        <meshStandardMaterial {...TITAN_MATERIAL} />
      </mesh>

      <mesh position={[-0.38, 0.48, 0]} rotation={[0.1, 0, armSpread]} castShadow>
        <boxGeometry args={[0.14, 0.42, 0.14]} />
        <meshStandardMaterial {...TITAN_MATERIAL} />
      </mesh>

      <mesh position={[0.38, 0.48, 0]} rotation={[0.1, 0, -armSpread]} castShadow>
        <boxGeometry args={[0.14, 0.42, 0.14]} />
        <meshStandardMaterial {...TITAN_MATERIAL} />
      </mesh>

      <mesh position={[-0.16, 0.08, 0]} castShadow>
        <boxGeometry args={[0.18, 0.38, 0.16]} />
        <meshStandardMaterial {...TITAN_MATERIAL} />
      </mesh>

      <mesh position={[0.16, 0.08, 0]} castShadow>
        <boxGeometry args={[0.18, 0.38, 0.16]} />
        <meshStandardMaterial {...TITAN_MATERIAL} />
      </mesh>

      <mesh position={[0, 0.42, -0.22]} castShadow>
        <boxGeometry args={[0.42, 0.46, 0.12]} />
        <meshStandardMaterial {...TITAN_MATERIAL} />
      </mesh>
    </group>
  );
}
