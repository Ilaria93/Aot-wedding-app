import type { HeroEnvironmentProps } from '@/scenes/environments/types';
import { AtmosphericHaze } from '@/scenes/environments/AtmosphericHaze';

const ARENA_WALL_COUNT = 18;
const ARENA_RADIUS = 9;

/** Open final arena with a ring of wall segments and a central platform. */
export function FinalArenaEnvironment({ visible }: HeroEnvironmentProps) {
  if (!visible) {
    return null;
  }

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <cylinderGeometry args={[ARENA_RADIUS + 2, ARENA_RADIUS + 2, 0.2, 48]} />
        <meshStandardMaterial color="#3a4038" roughness={0.9} metalness={0.05} />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
        <planeGeometry args={[ARENA_RADIUS * 1.6, ARENA_RADIUS * 1.6]} />
        <meshStandardMaterial color="#4a5248" roughness={0.88} metalness={0.04} />
      </mesh>

      <mesh castShadow position={[0, 0.55, 0]}>
        <cylinderGeometry args={[2.2, 2.6, 0.9, 24]} />
        <meshStandardMaterial color="#6a5a42" roughness={0.65} metalness={0.18} />
      </mesh>

      <mesh castShadow position={[0, 1.35, 0]}>
        <cylinderGeometry args={[1.2, 1.4, 0.8, 20]} />
        <meshStandardMaterial
          color="#b88a52"
          emissive="#6a4a22"
          emissiveIntensity={0.25}
          roughness={0.45}
          metalness={0.22}
        />
      </mesh>

      {Array.from({ length: ARENA_WALL_COUNT }, (_, index) => {
        const angle = (index / ARENA_WALL_COUNT) * Math.PI * 2;
        const x = Math.cos(angle) * ARENA_RADIUS;
        const z = Math.sin(angle) * ARENA_RADIUS;

        return (
          <mesh
            key={`arena-wall-${index}`}
            castShadow
            position={[x, 1.8, z]}
            rotation={[0, -angle, 0]}>
            <boxGeometry args={[2.4, 3.6, 0.8]} />
            <meshStandardMaterial color="#5a6058" roughness={0.84} metalness={0.06} />
          </mesh>
        );
      })}

      <mesh position={[0, 3.8, 0]}>
        <cylinderGeometry args={[ARENA_RADIUS + 0.5, ARENA_RADIUS + 0.5, 0.3, 48]} />
        <meshBasicMaterial color="#2a3028" transparent opacity={0.35} depthWrite={false} />
      </mesh>

      <pointLight color="#d8b070" intensity={18} distance={22} position={[0, 6, 0]} />
      <pointLight color="#8a9a78" intensity={10} distance={16} position={[-4, 3, 4]} />

      <AtmosphericHaze visible color="#a89068" opacity={0.14} y={4.5} scale={24} />
      <AtmosphericHaze visible color="#5a6058" opacity={0.1} y={1.4} scale={20} />
    </group>
  );
}
