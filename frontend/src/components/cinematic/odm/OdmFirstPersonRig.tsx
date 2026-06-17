import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

import { GearHandle } from '@/components/cinematic/odm/GearHandle';
import { GasBurstParticles } from '@/components/cinematic/odm/GasBurstParticles';
import { TensionCable } from '@/components/cinematic/odm/TensionCable';

/**
 * First-person mobility gear overlay: corner grips, forward tethers, and gas bursts.
 * Parented to the active camera each frame; reacts to {@link cameraMotionState}.
 */
export function OdmFirstPersonRig() {
  const { camera } = useThree();
  const rigRef = useRef<Group>(null);

  useFrame(() => {
    const rig = rigRef.current;
    if (!rig) {
      return;
    }

    rig.position.copy(camera.position);
    rig.quaternion.copy(camera.quaternion);
  });

  return (
    <group ref={rigRef}>
      <TensionCable side="left" />
      <TensionCable side="right" />
      <GearHandle side="left" />
      <GearHandle side="right" />
      <GasBurstParticles />
    </group>
  );
}
