/** Normalized CoupleStrike sequence progress in the range [0, 1]. */
export type CoupleStrikeProgress = number;

/** Cinematic phases within the CoupleStrike sequence. */
export type CoupleStrikePhase =
  | 'approach'
  | 'overtake'
  | 'spin'
  | 'cross'
  | 'impact'
  | 'aftermath';

/** Which side of the duel a placeholder character occupies. */
export type StrikeCharacterSide = 'left' | 'right';

/** World-space pose for a single strike character. */
export type StrikeCharacterPose = {
  readonly position: readonly [number, number, number];
  readonly rotation: readonly [number, number, number];
  readonly bladeRotation: number;
};

/** Full resolved state for the CoupleStrike cinematic at a given progress. */
export type CoupleStrikeSequenceState = {
  readonly progress: CoupleStrikeProgress;
  readonly phase: CoupleStrikePhase;
  readonly left: StrikeCharacterPose;
  readonly right: StrikeCharacterPose;
  readonly flashIntensity: number;
  readonly bladesCrossed: boolean;
};
