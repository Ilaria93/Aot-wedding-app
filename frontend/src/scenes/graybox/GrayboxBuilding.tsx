import { GRAYBOX_PALETTE } from '@/constants/grayboxPalette';
import { getGrayboxToneColor } from '@/scenes/graybox/GrayboxMeshMaterials';
import type { GrayboxBuildingSpec } from '@/scenes/graybox/types';

type GrayboxBuildingProps = {
  building: GrayboxBuildingSpec;
};

const materialProps = { roughness: 1, metalness: 0 } as const;

/**
 * Renders one graybox building with a readable rooftop silhouette (box, stepped, L or tower).
 */
export function GrayboxBuilding({ building }: GrayboxBuildingProps) {
  const color = getGrayboxToneColor(building.tone);
  const [width, height, depth] = building.size;
  const halfH = height / 2;

  if (building.shape === 'tower') {
    const baseH = height * 0.28;
    const shaftH = height - baseH;

    return (
      <group position={building.position}>
        <mesh castShadow receiveShadow position={[0, baseH / 2 - halfH, 0]}>
          <boxGeometry args={[width, baseH, depth]} />
          <meshStandardMaterial color={color} {...materialProps} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, baseH + shaftH / 2 - halfH, 0]}>
          <boxGeometry args={[width * 0.62, shaftH, depth * 0.62]} />
          <meshStandardMaterial color={color} {...materialProps} />
        </mesh>
      </group>
    );
  }

  if (building.shape === 'stepped') {
    const lowerH = height * 0.62;
    const upperH = height - lowerH;

    return (
      <group position={building.position}>
        <mesh castShadow receiveShadow position={[0, lowerH / 2 - halfH, 0]}>
          <boxGeometry args={[width, lowerH, depth]} />
          <meshStandardMaterial color={color} {...materialProps} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, lowerH + upperH / 2 - halfH, 0]}>
          <boxGeometry args={[width * 0.72, upperH, depth * 0.72]} />
          <meshStandardMaterial color={color} {...materialProps} />
        </mesh>
      </group>
    );
  }

  if (building.shape === 'lShape') {
    const wingW = width * 0.55;
    const wingD = depth * 0.55;

    return (
      <group position={building.position}>
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[width, height, wingD]} />
          <meshStandardMaterial color={color} {...materialProps} />
        </mesh>
        <mesh
          castShadow
          receiveShadow
          position={[(width - wingW) / 2, 0, -(depth - wingD) / 2]}>
          <boxGeometry args={[wingW, height * 0.88, depth - wingD]} />
          <meshStandardMaterial color={color} {...materialProps} />
        </mesh>
      </group>
    );
  }

  return (
    <mesh castShadow receiveShadow position={building.position}>
      <boxGeometry args={building.size} />
      <meshStandardMaterial color={color} {...materialProps} />
    </mesh>
  );
}
