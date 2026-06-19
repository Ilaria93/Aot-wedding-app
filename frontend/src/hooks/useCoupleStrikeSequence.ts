import { useMemo } from 'react';

import type { CoupleStrikeSequenceState } from '@/types/coupleStrike';
import {
  getCoupleStrikeProgress,
  resolveCoupleStrikeSequence,
} from '@/scenes/sequences/coupleStrikeLogic';

type UseCoupleStrikeSequenceResult = CoupleStrikeSequenceState;

/**
 * Resolves CoupleStrike sequence state from global scroll progress.
 * Exposes normalized `progress` in the range [0, 1].
 */
export function useCoupleStrikeSequence(globalProgress: number): UseCoupleStrikeSequenceResult {
  return useMemo(() => {
    const progress = getCoupleStrikeProgress(globalProgress);
    return resolveCoupleStrikeSequence(progress);
  }, [globalProgress]);
}
