import type { HeroEnvironmentProps } from '@/scenes/environments/types';
import { AtmosphericHaze } from '@/scenes/environments/AtmosphericHaze';

type BuildingSpec = {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
};

const ROOFTOP_BUILDINGS: readonly BuildingSpec[] = [
  { position: [-4, 1.4, -3], size: [1.4, 2.8, 1.4], color: '#5f6864' },
  { position: [-2, 2.2, -1], size: [1.8, 4.4, 1.6], color: '#6b7268' },
  { position: [0.5, 1.8, -2.5], size: [2.2, 3.6, 2], color: '#59615c' },
  { position: [3, 1.2, -1.5], size: [1.2, 2.4, 1.2], color: '#656d68' },
  { position: [4.2, 2.6, -3.8], size: [1.6, 5.2, 1.4], color: '#545c58' },
  { position: [-3.2, 1, 1.5], size: [1.6, 2, 2.2], color: '#6a716c' },
  { position: [2.5, 1.6, 2], size: [2, 3.2, 1.8], color: '#5c6460' },
];

const ROOFTOP_CHIMNEYS: readonly [number, number, number][] = [
  [-2, 4.8, -1],
  [0.5, 4.2, -2.5],
  [4.2, 5.8, -3.8],
];

/** Dense urban rooftops built from boxes and chimney cylinders. */
export function RooftopsDistrictEnvironment({ visible }: HeroEnvironmentProps) {
  if (!visible) {
    return null;
  }

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[36, 36]} />
        <meshStandardMaterial color="#3f4642" roughness={0.92} metalness={0.04} />
      </mesh>

      {ROOFTOP_BUILDINGS.map((building) => (
        <mesh
          key={`${building.position.join('-')}-${building.size.join('-')}`}
          castShadow
          receiveShadow
          position={[
            building.position[0],
            building.size[1] / 2,
            building.position[2],
          ]}>
          <boxGeometry args={building.size} />
          <meshStandardMaterial color={building.color} roughness={0.78} metalness={0.06} />
        </mesh>
      ))}

      {ROOFTOP_CHIMNEYS.map((position) => (
        <mesh key={position.join('-')} castShadow position={position}>
          <cylinderGeometry args={[0.12, 0.14, 0.9, 8]} />
          <meshStandardMaterial color="#4a4f4c" roughness={0.7} metalness={0.12} />
        </mesh>
      ))}

      <mesh position={[1.2, 2.1, 2.2]}>
        <boxGeometry args={[0.35, 0.5, 0.35]} />
        <meshStandardMaterial
          color="#c9a56a"
          emissive="#8a6530"
          emissiveIntensity={0.35}
          roughness={0.4}
        />
      </mesh>

      <AtmosphericHaze visible color="#8a9a9f" opacity={0.22} y={3.2} />
      <AtmosphericHaze visible color="#6d787e" opacity={0.12} y={1.6} scale={22} />
    </group>
  );
}
