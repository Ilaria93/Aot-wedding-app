import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Points } from 'three';

const PARTICLE_COUNT = 36;
const STEAM_SPREAD = 1.8;
const STEAM_HEIGHT = 5.5;
const RISE_SPEED = 0.35;
const DRIFT_SPEED = 0.12;

type SteamParticlesProps = {
  seed: number;
};

/**
 * Lightweight steam wisps around a colossal body — instanced as a single Points draw call.
 */
export function SteamParticles({ seed }: SteamParticlesProps) {
  const pointsRef = useRef<Points>(null);
  const offsets = useMemo(() => {
    const values = new Float32Array(PARTICLE_COUNT * 3);
    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const angle = (index / PARTICLE_COUNT) * Math.PI * 2 + seed * 1.7;
      const radius = 0.6 + (index % 5) * 0.22;
      values[index * 3] = Math.cos(angle) * radius * STEAM_SPREAD * 0.35;
      values[index * 3 + 1] = 1.8 + (index % 7) * 0.55;
      values[index * 3 + 2] = Math.sin(angle) * radius * STEAM_SPREAD * 0.25;
    }
    return values;
  }, [seed]);

  const positions = useMemo(() => offsets.slice(), [offsets]);
  const velocities = useMemo(() => {
    const values = new Float32Array(PARTICLE_COUNT * 3);
    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      values[index * 3] = (Math.sin(seed + index) * 0.5 + 0.5) * DRIFT_SPEED;
      values[index * 3 + 1] = RISE_SPEED + (index % 4) * 0.06;
      values[index * 3 + 2] = (Math.cos(seed * 0.7 + index) * 0.5 + 0.5) * DRIFT_SPEED;
    }
    return values;
  }, [seed]);

  useFrame((_, delta) => {
    const points = pointsRef.current;
    if (!points) {
      return;
    }

    const attribute = points.geometry.attributes.position;
    const array = attribute.array as Float32Array;

    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const base = index * 3;
      array[base] += velocities[base] * delta;
      array[base + 1] += velocities[base + 1] * delta;
      array[base + 2] += velocities[base + 2] * delta;

      if (array[base + 1] > STEAM_HEIGHT) {
        array[base] = offsets[base];
        array[base + 1] = offsets[base + 1];
        array[base + 2] = offsets[base + 2];
      }
    }

    attribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} frustumCulled>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#c5d0c8"
        size={0.22}
        transparent
        opacity={0.38}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
