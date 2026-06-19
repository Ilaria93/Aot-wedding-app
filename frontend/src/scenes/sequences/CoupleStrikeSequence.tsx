import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';

import { PlaceholderStrikeCharacter } from '@/cinematic/characters/PlaceholderStrikeCharacter';
import type { CoupleStrikeProgress, StrikeCharacterPose } from '@/types/coupleStrike';
import {
  getCoupleStrikeProgress,
  isCoupleStrikeSceneActive,
  resolveCoupleStrikeSequence,
} from '@/scenes/sequences/coupleStrikeLogic';

type CoupleStrikeSequenceProps = {
  /** Global scroll progress in the range [0, 1]. */
  globalProgress?: CoupleStrikeProgress;
  /** Optional direct sequence progress override for isolated previews. */
  sequenceProgress?: CoupleStrikeProgress;
};

function toFirstPersonPose(pose: StrikeCharacterPose): StrikeCharacterPose {
  return {
    position: [pose.position[0], pose.position[1] - 1.45, -pose.position[2]],
    rotation: [pose.rotation[0], -pose.rotation[1], -pose.rotation[2]],
    bladeRotation: -pose.bladeRotation,
  };
}

/**
 * Scroll-driven duel sequence with two placeholder characters, blade cross and impact flash.
 */
export function CoupleStrikeSequence({
  globalProgress = 0,
  sequenceProgress,
}: CoupleStrikeSequenceProps) {
  const { camera } = useThree();
  const groupRef = useRef<Group>(null);
  const progress = sequenceProgress ?? getCoupleStrikeProgress(globalProgress);
  const state = useMemo(() => resolveCoupleStrikeSequence(progress), [progress]);
  const leftPose = useMemo(() => toFirstPersonPose(state.left), [state.left]);
  const rightPose = useMemo(() => toFirstPersonPose(state.right), [state.right]);
  const isActive = sequenceProgress !== undefined || isCoupleStrikeSceneActive(globalProgress);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    group.position.copy(camera.position);
    group.quaternion.copy(camera.quaternion);
  });

  return (
    <group ref={groupRef}>
      <PlaceholderStrikeCharacter side="left" pose={leftPose} visible={isActive} />
      <PlaceholderStrikeCharacter side="right" pose={rightPose} visible={isActive} />

      {state.bladesCrossed ? (
        <pointLight
          position={[0, 1.05, -0.5]}
          intensity={1.6 + state.flashIntensity * 4}
          color="#fff2d6"
          distance={4}
        />
      ) : null}
    </group>
  );
}

export { getCoupleStrikeProgress, isCoupleStrikeSceneActive, resolveCoupleStrikeSequence };
