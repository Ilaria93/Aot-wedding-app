import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group, Mesh } from 'three';

import type { TitanSilhouettePlacement } from '@/scenes/titanCorridor/titanCorridorLayout';
import { SILHOUETTE_MATERIAL_PROPS } from '@/scenes/titanCorridor/silhouetteMaterial';

import { SteamParticles } from './SteamParticles';

type GiantSilhouetteProps = TitanSilhouettePlacement;

const BASE_HEIGHT = 9.5;

/**
 * Stylized low-poly colossus with subtle idle sway — abstract geometry only.
 */
export function GiantSilhouette({
  position,
  rotationY,
  scale,
  armSpread,
  torsoLean,
  id,
}: GiantSilhouetteProps) {
  const rootRef = useRef<Group>(null);
  const torsoRef = useRef<Mesh>(null);
  const headRef = useRef<Mesh>(null);
  const leftArmRef = useRef<Mesh>(null);
  const rightArmRef = useRef<Mesh>(null);
  const phase = useMemo(() => id.length * 0.31, [id]);

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime;
    const root = rootRef.current;
    const torso = torsoRef.current;
    const head = headRef.current;
    const leftArm = leftArmRef.current;
    const rightArm = rightArmRef.current;

    if (!root || !torso || !head || !leftArm || !rightArm) {
      return;
    }

    root.rotation.y = rotationY + Math.sin(elapsed * 0.22 + phase) * 0.018;
    torso.rotation.z = torsoLean + Math.sin(elapsed * 0.18 + phase) * 0.012;
    torso.scale.y = 1 + Math.sin(elapsed * 0.55 + phase) * 0.008;
    head.rotation.x = Math.sin(elapsed * 0.3 + phase) * 0.02;
    leftArm.rotation.z = armSpread + Math.sin(elapsed * 0.25 + phase) * 0.025;
    rightArm.rotation.z = -armSpread + Math.sin(elapsed * 0.27 + phase + 1.2) * 0.025;
  });

  return (
    <group ref={rootRef} position={position} scale={scale * BASE_HEIGHT}>
      <mesh ref={torsoRef} position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.55, 0.5, 0.32]} />
        <meshStandardMaterial {...SILHOUETTE_MATERIAL_PROPS} />
      </mesh>

      <mesh ref={headRef} position={[0, 0.78, 0.02]} castShadow>
        <dodecahedronGeometry args={[0.16, 0]} />
        <meshStandardMaterial {...SILHOUETTE_MATERIAL_PROPS} />
      </mesh>

      <mesh ref={leftArmRef} position={[-0.38, 0.48, 0]} rotation={[0.1, 0, armSpread]} castShadow>
        <boxGeometry args={[0.14, 0.42, 0.14]} />
        <meshStandardMaterial {...SILHOUETTE_MATERIAL_PROPS} />
      </mesh>

      <mesh ref={rightArmRef} position={[0.38, 0.48, 0]} rotation={[0.1, 0, -armSpread]} castShadow>
        <boxGeometry args={[0.14, 0.42, 0.14]} />
        <meshStandardMaterial {...SILHOUETTE_MATERIAL_PROPS} />
      </mesh>

      <mesh position={[-0.16, 0.08, 0]} castShadow>
        <boxGeometry args={[0.18, 0.38, 0.16]} />
        <meshStandardMaterial {...SILHOUETTE_MATERIAL_PROPS} />
      </mesh>

      <mesh position={[0.16, 0.08, 0]} castShadow>
        <boxGeometry args={[0.18, 0.38, 0.16]} />
        <meshStandardMaterial {...SILHOUETTE_MATERIAL_PROPS} />
      </mesh>

      <SteamParticles seed={phase * 10} />
    </group>
  );
}
