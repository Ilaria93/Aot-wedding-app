import type { HeroEnvironmentProps } from '@/scenes/environments/types';
import { AtmosphericHaze } from '@/scenes/environments/AtmosphericHaze';

const CORRIDOR_PILLARS: readonly [number, number, number][] = [
  [-3.2, 0, -8],
  [-3.2, 0, -4],
  [-3.2, 0, 0],
  [-3.2, 0, 4],
  [-3.2, 0, 8],
  [3.2, 0, -8],
  [3.2, 0, -4],
  [3.2, 0, 0],
  [3.2, 0, 4],
  [3.2, 0, 8],
];

const WARNING_STRIPES: readonly [number, number, number][] = [
  [-3.05, 1.2, -2],
  [3.05, 1.2, 2],
  [0, 1.2, 6],
];

/** Claustrophobic titan passage with pillars, low ceiling and steam haze. */
export function TitanCorridorEnvironment({ visible }: HeroEnvironmentProps) {
  if (!visible) {
    return null;
  }

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[14, 36]} />
        <meshStandardMaterial color="#2a3028" roughness={0.96} metalness={0.03} />
      </mesh>

      <mesh receiveShadow position={[0, 4.2, 0]}>
        <boxGeometry args={[14, 0.5, 36]} />
        <meshStandardMaterial color="#1e241c" roughness={0.92} metalness={0.02} />
      </mesh>

      <mesh castShadow receiveShadow position={[-3.8, 2.2, 0]}>
        <boxGeometry args={[0.8, 4.4, 36]} />
        <meshStandardMaterial color="#343a34" roughness={0.9} />
      </mesh>

      <mesh castShadow receiveShadow position={[3.8, 2.2, 0]}>
        <boxGeometry args={[0.8, 4.4, 36]} />
        <meshStandardMaterial color="#343a34" roughness={0.9} />
      </mesh>

      {CORRIDOR_PILLARS.map((position) => (
        <mesh key={position.join('-')} castShadow position={[position[0], 2.6, position[2]]}>
          <cylinderGeometry args={[0.55, 0.65, 5.2, 12]} />
          <meshStandardMaterial color="#4a5248" roughness={0.82} metalness={0.08} />
        </mesh>
      ))}

      {WARNING_STRIPES.map((position) => (
        <mesh key={position.join('-')} position={position}>
          <boxGeometry args={[0.2, 0.5, 1.8]} />
          <meshStandardMaterial
            color="#8a4a3a"
            emissive="#5a2a20"
            emissiveIntensity={0.45}
            roughness={0.5}
          />
        </mesh>
      ))}

      <pointLight color="#6a8a5a" intensity={12} distance={14} position={[0, 3.2, -4]} />
      <pointLight color="#4a5a48" intensity={8} distance={12} position={[0, 2.8, 5]} />

      <AtmosphericHaze visible color="#4a5a48" opacity={0.32} y={2.8} scale={16} />
      <AtmosphericHaze visible color="#3a4a38" opacity={0.2} y={1.1} scale={14} />
    </group>
  );
}
