import type { HeroEnvironmentProps } from '@/scenes/environments/types';

type AtmosphericHazeProps = HeroEnvironmentProps & {
  color: string;
  opacity?: number;
  y?: number;
  scale?: number;
};

/**
 * Horizontal haze plane used to suggest depth and atmosphere inside placeholder environments.
 */
export function AtmosphericHaze({
  visible,
  color,
  opacity = 0.18,
  y = 2.4,
  scale = 28,
}: AtmosphericHazeProps) {
  if (!visible) {
    return null;
  }

  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[scale, scale]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}
