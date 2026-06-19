import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
} from 'three';

import {
  ODM_HANDLE_OFFSET,
  ODM_PARTICLE_BURST_THRESHOLD,
  ODM_PARTICLE_POOL_SIZE,
  ODM_PARTICLE_SPAWN_PER_BURST,
  odmGearTheme,
} from '@/constants/odmGear';
import { cameraMotionState } from '@/cinematic/camera/cameraMotion';

type GasSlot = {
  life: number;
  maxLife: number;
};

/**
 * Lightweight pooled gas burst particles triggered by camera acceleration spikes.
 */
export function GasBurstParticles() {
  const geometryRef = useRef<BufferGeometry>(null);
  const slotsRef = useRef<GasSlot[]>(
    Array.from({ length: ODM_PARTICLE_POOL_SIZE }, () => ({ life: 0, maxLife: 0 })),
  );
  const velocitiesRef = useRef<Float32Array>(new Float32Array(ODM_PARTICLE_POOL_SIZE * 3));
  const prevAccelRef = useRef(0);
  const freeSlotCursor = useRef(0);

  const positions = useMemo(() => new Float32Array(ODM_PARTICLE_POOL_SIZE * 3), []);

  const spawnBurst = (originX: number, originY: number, originZ: number, intensity: number) => {
    const slots = slotsRef.current;
    const velocities = velocitiesRef.current;
    const spawnCount = Math.min(
      ODM_PARTICLE_SPAWN_PER_BURST + Math.floor(intensity * 2),
      ODM_PARTICLE_POOL_SIZE,
    );

    for (let spawned = 0; spawned < spawnCount; spawned += 1) {
      const slotIndex = freeSlotCursor.current % ODM_PARTICLE_POOL_SIZE;
      freeSlotCursor.current += 1;

      const slot = slots[slotIndex];
      const life = 0.22 + Math.random() * 0.28;
      slot.life = life;
      slot.maxLife = life;

      const velocityOffset = slotIndex * 3;
      velocities[velocityOffset] = (Math.random() - 0.5) * 0.35;
      velocities[velocityOffset + 1] = (Math.random() - 0.2) * 0.25;
      velocities[velocityOffset + 2] = 0.25 + Math.random() * 0.55 * intensity;

      const positionOffset = slotIndex * 3;
      positions[positionOffset] = originX + (Math.random() - 0.5) * 0.04;
      positions[positionOffset + 1] = originY + (Math.random() - 0.5) * 0.04;
      positions[positionOffset + 2] = originZ + (Math.random() - 0.5) * 0.03;
    }
  };

  useFrame((_, delta) => {
    const geometry = geometryRef.current;
    if (!geometry) {
      return;
    }

    const accel = cameraMotionState.accelMagnitude;
    const accelDelta = accel - prevAccelRef.current;
    prevAccelRef.current = accel;

    if (accel > ODM_PARTICLE_BURST_THRESHOLD || accelDelta > 0.9) {
      const burstStrength = Math.min(accel * 0.35, 2.5);
      spawnBurst(-ODM_HANDLE_OFFSET.x, ODM_HANDLE_OFFSET.y, ODM_HANDLE_OFFSET.z, burstStrength);
      spawnBurst(ODM_HANDLE_OFFSET.x, ODM_HANDLE_OFFSET.y, ODM_HANDLE_OFFSET.z, burstStrength);
    }

    const slots = slotsRef.current;
    const velocities = velocitiesRef.current;
    const positionAttribute = geometry.getAttribute('position') as BufferAttribute;

    for (let index = 0; index < ODM_PARTICLE_POOL_SIZE; index += 1) {
      const slot = slots[index];
      const positionOffset = index * 3;

      if (slot.life <= 0) {
        positions[positionOffset + 1] = -999;
        continue;
      }

      slot.life -= delta;
      positions[positionOffset] += velocities[positionOffset] * delta;
      positions[positionOffset + 1] += velocities[positionOffset + 1] * delta;
      positions[positionOffset + 2] += velocities[positionOffset + 2] * delta;

      velocities[positionOffset] *= 0.96;
      velocities[positionOffset + 1] *= 0.94;
      velocities[positionOffset + 2] *= 0.92;
    }

    positionAttribute.array.set(positions);
    positionAttribute.needsUpdate = true;
  });

  return (
    <points renderOrder={8}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={ODM_PARTICLE_POOL_SIZE}
          usage={DynamicDrawUsage}
        />
      </bufferGeometry>
      <pointsMaterial
        color={odmGearTheme.gasCore}
        size={0.045}
        transparent
        opacity={0.72}
        depthWrite={false}
        blending={AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}
