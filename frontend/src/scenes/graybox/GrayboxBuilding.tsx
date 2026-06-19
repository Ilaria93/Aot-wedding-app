import { GRAYBOX_PALETTE } from '@/constants/grayboxPalette';
import { getGrayboxToneColor } from '@/scenes/graybox/GrayboxMeshMaterials';
import type { GrayboxBuildingSpec } from '@/scenes/graybox/types';

type GrayboxBuildingProps = {
  building: GrayboxBuildingSpec;
};

const materialProps = { roughness: 1, metalness: 0 } as const;

function RooftopCap({
  width,
  depth,
  height,
  roofTone,
}: {
  width: number;
  depth: number;
  height: number;
  roofTone: GrayboxBuildingSpec['roofTone'];
}) {
  const color = roofTone === 'clay' ? GRAYBOX_PALETTE.roofClay : GRAYBOX_PALETTE.roofClayDark;

  return (
    <mesh castShadow receiveShadow position={[0, height / 2 + 0.16, 0]}>
      <boxGeometry args={[width * 1.05, 0.32, depth * 1.05]} />
      <meshStandardMaterial color={color} {...materialProps} />
    </mesh>
  );
}

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
        <RooftopCap
          width={width * 0.62}
          depth={depth * 0.62}
          height={height}
          roofTone={building.roofTone}
        />
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
        <RooftopCap
          width={width * 0.72}
          depth={depth * 0.72}
          height={height}
          roofTone={building.roofTone}
        />
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
        <RooftopCap width={width} depth={wingD} height={height} roofTone={building.roofTone} />
      </group>
    );
  }

  return (
    <group position={building.position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={building.size} />
        <meshStandardMaterial color={color} {...materialProps} />
      </mesh>
      <RooftopCap width={width} depth={depth} height={height} roofTone={building.roofTone} />
    </group>
  );
}
