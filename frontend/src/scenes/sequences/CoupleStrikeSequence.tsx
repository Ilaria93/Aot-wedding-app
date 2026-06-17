import { useMemo } from 'react';

import { PlaceholderStrikeCharacter } from '@/components/cinematic/PlaceholderStrikeCharacter';
import type { CoupleStrikeProgress } from '@/types/coupleStrike';
import {
  getCoupleStrikeProgress,
  isCoupleStrikeSceneActive,
  resolveCoupleStrikeSequence,
} from '@/utils/coupleStrikeSequence';

type CoupleStrikeSequenceProps = {
  /** Global scroll progress in the range [0, 1]. */
  globalProgress?: CoupleStrikeProgress;
  /** Optional direct sequence progress override for isolated previews. */
  sequenceProgress?: CoupleStrikeProgress;
};

/**
 * Scroll-driven duel sequence with two placeholder characters, blade cross and impact flash.
 */
export function CoupleStrikeSequence({
  globalProgress = 0,
  sequenceProgress,
}: CoupleStrikeSequenceProps) {
  const progress = sequenceProgress ?? getCoupleStrikeProgress(globalProgress);
  const state = useMemo(() => resolveCoupleStrikeSequence(progress), [progress]);
  const isActive = sequenceProgress !== undefined || isCoupleStrikeSceneActive(globalProgress);

  return (
    <group>
      <PlaceholderStrikeCharacter side="left" pose={state.left} visible={isActive} />
      <PlaceholderStrikeCharacter side="right" pose={state.right} visible={isActive} />

      {state.bladesCrossed ? (
        <pointLight
          position={[0, 1.05, 0.5]}
          intensity={1.6 + state.flashIntensity * 4}
          color="#fff2d6"
          distance={4}
        />
      ) : null}
    </group>
  );
}

export { getCoupleStrikeProgress, isCoupleStrikeSceneActive, resolveCoupleStrikeSequence };
