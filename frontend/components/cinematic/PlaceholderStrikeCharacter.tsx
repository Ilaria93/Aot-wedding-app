import type { StrikeCharacterPose, StrikeCharacterSide } from '@/types/coupleStrike';

type PlaceholderStrikeCharacterProps = {
  side: StrikeCharacterSide;
  pose: StrikeCharacterPose;
  visible: boolean;
};

const SIDE_COLORS: Record<StrikeCharacterSide, { body: string; accent: string; blade: string }> = {
  left: {
    body: '#6a7a6e',
    accent: '#b88a52',
    blade: '#d4c4a0',
  },
  right: {
    body: '#5f6f62',
    accent: '#5f7556',
    blade: '#c8d0c9',
  },
};

/**
 * Capsule-and-blade placeholder for a CoupleStrike duelist.
 */
export function PlaceholderStrikeCharacter({ side, pose, visible }: PlaceholderStrikeCharacterProps) {
  if (!visible) {
    return null;
  }

  const colors = SIDE_COLORS[side];
  const bladeSide = side === 'left' ? 1 : -1;

  return (
    <group position={pose.position} rotation={pose.rotation}>
      <mesh castShadow position={[0, 0.55, 0]}>
        <capsuleGeometry args={[0.28, 0.72, 6, 12]} />
        <meshStandardMaterial color={colors.body} roughness={0.5} metalness={0.1} />
      </mesh>

      <mesh castShadow position={[bladeSide * 0.22, 0.95, 0.05]} rotation={[0, 0, bladeSide * 0.25]}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
        <meshStandardMaterial
          color={colors.accent}
          emissive={colors.accent}
          emissiveIntensity={0.12}
          roughness={0.45}
        />
      </mesh>

      <group position={[bladeSide * 0.34, 1.02, 0.12]} rotation={[0, pose.bladeRotation, bladeSide * -0.45]}>
        <mesh castShadow position={[0, 0, 0.55]}>
          <boxGeometry args={[0.06, 0.02, 1.1]} />
          <meshStandardMaterial color={colors.blade} metalness={0.65} roughness={0.28} />
        </mesh>
        <mesh castShadow position={[0, 0, 1.12]}>
          <coneGeometry args={[0.04, 0.14, 6]} />
          <meshStandardMaterial color={colors.blade} metalness={0.7} roughness={0.22} />
        </mesh>
      </group>
    </group>
  );
}
