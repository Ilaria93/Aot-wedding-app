import type { HeroEnvironmentProps } from '@/scenes/environments/types';
import { AtmosphericHaze } from '@/scenes/environments/AtmosphericHaze';

const WATCH_TOWERS: readonly [number, number, number][] = [
  [-7.5, 0, -6],
  [7.5, 0, -6],
  [-7.5, 0, 4],
  [7.5, 0, 4],
];

/** Monumental wall corridor with flanking towers and heavy mist. */
export function GiantWallsEnvironment({ visible }: HeroEnvironmentProps) {
  if (!visible) {
    return null;
  }

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[40, 48]} />
        <meshStandardMaterial color="#4a5056" roughness={0.95} metalness={0.02} />
      </mesh>

      <mesh castShadow receiveShadow position={[-6.5, 6, 0]}>
        <boxGeometry args={[2.4, 12, 44]} />
        <meshStandardMaterial color="#6a7178" roughness={0.88} metalness={0.05} />
      </mesh>

      <mesh castShadow receiveShadow position={[6.5, 6, 0]}>
        <boxGeometry args={[2.4, 12, 44]} />
        <meshStandardMaterial color="#6a7178" roughness={0.88} metalness={0.05} />
      </mesh>

      <mesh position={[-6.5, 11.8, 0]}>
        <boxGeometry args={[2.8, 0.6, 44.4]} />
        <meshStandardMaterial color="#7a828a" roughness={0.82} metalness={0.08} />
      </mesh>

      <mesh position={[6.5, 11.8, 0]}>
        <boxGeometry args={[2.8, 0.6, 44.4]} />
        <meshStandardMaterial color="#7a828a" roughness={0.82} metalness={0.08} />
      </mesh>

      {WATCH_TOWERS.map((position) => (
        <group key={position.join('-')}>
          <mesh castShadow position={[position[0], 4.5, position[2]]}>
            <cylinderGeometry args={[1.1, 1.3, 9, 10]} />
            <meshStandardMaterial color="#5c636a" roughness={0.8} metalness={0.1} />
          </mesh>
          <mesh castShadow position={[position[0], 9.4, position[2]]}>
            <cylinderGeometry args={[1.4, 1.1, 1.2, 10]} />
            <meshStandardMaterial color="#707880" roughness={0.75} metalness={0.12} />
          </mesh>
        </group>
      ))}

      <mesh position={[0, 0.4, -8]}>
        <boxGeometry args={[10, 0.8, 1.2]} />
        <meshStandardMaterial color="#565d64" roughness={0.9} />
      </mesh>

      <AtmosphericHaze visible color="#9aa3ab" opacity={0.28} y={5.5} scale={32} />
      <AtmosphericHaze visible color="#8a939c" opacity={0.16} y={2.2} scale={26} />
    </group>
  );
}
