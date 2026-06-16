import {
  TITAN_CORRIDOR_SILHOUETTES,
  TITAN_CORRIDOR_WALLS,
} from '@/scenes/titanCorridor/titanCorridorLayout';

import { GiantSilhouette } from './GiantSilhouette';

/**
 * Narrow corridor with four colossal silhouettes flanking the hero camera spline.
 * Optimized for real-time WebGL: low-poly meshes, shared materials, lightweight particles.
 */
export function TitanCorridorScene() {
  return (
    <group name="titan-corridor">
      {TITAN_CORRIDOR_WALLS.map((wall) => (
        <mesh key={`wall-${wall.position.join('-')}`} position={wall.position} receiveShadow>
          <boxGeometry args={wall.size} />
          <meshStandardMaterial color="#1e2822" roughness={0.95} metalness={0.03} />
        </mesh>
      ))}

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 7]}>
        <planeGeometry args={[22, 20]} />
        <meshStandardMaterial color="#243028" roughness={0.92} metalness={0.02} />
      </mesh>

      <pointLight position={[0, 6, 4]} intensity={0.35} color="#8a9a8f" distance={18} decay={2} />

      {TITAN_CORRIDOR_SILHOUETTES.map((placement) => (
        <GiantSilhouette key={placement.id} {...placement} />
      ))}
    </group>
  );
}
