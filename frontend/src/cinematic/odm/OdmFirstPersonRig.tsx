import type { RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

import { GearHandle } from '@/cinematic/odm/GearHandle';
import { GasBurstParticles } from '@/cinematic/odm/GasBurstParticles';
import { TensionCable } from '@/cinematic/odm/TensionCable';
import {
  isOdmGearVisible,
  resolveOdmGearRevealOpacity,
} from '@/cinematic/camera/openingCameraMotion';

type OdmFirstPersonRigProps = {
  /** Global hero scroll progress in the range [0, 1]. */
  progress?: number;
  /** High-frequency progress ref read every frame (web scroll scrub). */
  progressRef?: RefObject<number>;
};

/**
 * First-person mobility gear overlay: corner grips, forward tethers, and gas bursts.
 * Hidden during the static opening and ground sprint — revealed only after the first hook.
 */
export function OdmFirstPersonRig({ progress = 0, progressRef }: OdmFirstPersonRigProps) {
  const { camera } = useThree();
  const rigRef = useRef<Group>(null);

  useFrame(() => {
    const rig = rigRef.current;
    if (!rig) {
      return;
    }

    const activeProgress = progressRef?.current ?? progress;
    const visible = isOdmGearVisible(activeProgress);
    const reveal = resolveOdmGearRevealOpacity(activeProgress);

    rig.visible = visible && reveal > 0.04;
    rig.scale.setScalar(0.85 + reveal * 0.15);

    if (!rig.visible) {
      return;
    }

    rig.position.copy(camera.position);
    rig.quaternion.copy(camera.quaternion);
  });

  return (
    <group ref={rigRef} visible={false}>
      <TensionCable side="left" />
      <TensionCable side="right" />
      <GearHandle side="left" />
      <GearHandle side="right" />
      <GasBurstParticles />
    </group>
  );
}
