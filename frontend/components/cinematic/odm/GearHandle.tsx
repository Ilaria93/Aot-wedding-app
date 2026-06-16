import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';

import { ODM_HANDLE_OFFSET, odmGearTheme } from '@/constants/odmGear';
import { cameraMotionState } from '@/utils/cameraMotion';

export type GearHandleSide = 'left' | 'right';

type GearHandleProps = {
  side: GearHandleSide;
};

const sideSign: Record<GearHandleSide, number> = {
  left: -1,
  right: 1,
};

/**
 * Stylized blade-grip handle for first-person mobility gear (generic anime silhouette).
 */
export function GearHandle({ side }: GearHandleProps) {
  const rootRef = useRef<Group>(null);
  const sign = sideSign[side];
  const basePosition = useMemo(
    () => [sign * ODM_HANDLE_OFFSET.x, ODM_HANDLE_OFFSET.y, ODM_HANDLE_OFFSET.z] as const,
    [sign],
  );

  useFrame(() => {
    const group = rootRef.current;
    if (!group) {
      return;
    }

    const swayX = cameraMotionState.acceleration.x * 0.018 * -sign;
    const swayY = cameraMotionState.acceleration.y * 0.012;
    const kickZ = Math.min(cameraMotionState.accelMagnitude * 0.008, 0.06);

    group.position.set(
      basePosition[0] + swayX,
      basePosition[1] + swayY,
      basePosition[2] + kickZ,
    );
    group.rotation.set(
      swayY * 0.6,
      sign * 0.22 + swayX * 0.4,
      sign * -0.35 + cameraMotionState.acceleration.z * 0.02,
    );
  });

  return (
    <group ref={rootRef} position={basePosition}>
      <mesh renderOrder={10}>
        <boxGeometry args={[0.05, 0.16, 0.05]} />
        <meshStandardMaterial
          color={odmGearTheme.gripMetal}
          metalness={0.72}
          roughness={0.28}
          depthTest={false}
        />
      </mesh>

      <mesh position={[0, -0.1, 0.01]} rotation={[0.35, 0, 0]} renderOrder={10}>
        <boxGeometry args={[0.07, 0.05, 0.04]} />
        <meshStandardMaterial
          color={odmGearTheme.gripAccent}
          metalness={0.55}
          roughness={0.35}
          depthTest={false}
        />
      </mesh>

      <mesh position={[sign * 0.045, 0.02, 0]} rotation={[0, 0, sign * 0.5]} renderOrder={10}>
        <boxGeometry args={[0.09, 0.018, 0.02]} />
        <meshStandardMaterial
          color={odmGearTheme.gripMetal}
          metalness={0.8}
          roughness={0.22}
          depthTest={false}
        />
      </mesh>

      <mesh position={[0, 0.1, -0.01]} renderOrder={10}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshStandardMaterial
          color={odmGearTheme.gripAccent}
          metalness={0.65}
          roughness={0.3}
          depthTest={false}
        />
      </mesh>

      <mesh position={[sign * -0.03, -0.04, 0.03]} rotation={[0.8, 0, sign * 0.3]} renderOrder={10}>
        <torusGeometry args={[0.028, 0.006, 6, 10, Math.PI * 0.65]} />
        <meshStandardMaterial
          color={odmGearTheme.cableSteel}
          metalness={0.9}
          roughness={0.18}
          depthTest={false}
        />
      </mesh>
    </group>
  );
}
