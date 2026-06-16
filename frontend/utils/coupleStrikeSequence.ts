import { OPERATION_RAVENNA_TIMELINE } from '@/constants/operationRavennaTimeline';
import type {
  CoupleStrikePhase,
  CoupleStrikeProgress,
  CoupleStrikeSequenceState,
  StrikeCharacterPose,
} from '@/types/coupleStrike';
import { clampTimelineProgress, resolveSceneTimelineState } from '@/utils/sceneTimeline';

/** Progress value at which the blade cross impact occurs. */
export const COUPLE_STRIKE_IMPACT_PROGRESS = 0.82;

/** Half-width of the white-flash envelope around the impact moment. */
export const COUPLE_STRIKE_FLASH_HALF_WIDTH = 0.05;

const PHASE_APPROACH_END = 0.18;
const PHASE_OVERTAKE_END = 0.48;
const PHASE_SPIN_END = 0.72;
const PHASE_CROSS_END = 0.82;

type CharacterTrack = {
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  bladeRotation: number;
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInQuad(t: number): number {
  return t * t;
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

function easeInCubic(t: number): number {
  return t * t * t;
}

function segmentProgress(progress: CoupleStrikeProgress, start: number, end: number): number {
  if (progress <= start) {
    return 0;
  }
  if (progress >= end) {
    return 1;
  }

  return (progress - start) / (end - start);
}

function resolvePhase(progress: CoupleStrikeProgress): CoupleStrikePhase {
  if (progress < PHASE_APPROACH_END) {
    return 'approach';
  }
  if (progress < PHASE_OVERTAKE_END) {
    return 'overtake';
  }
  if (progress < PHASE_SPIN_END) {
    return 'spin';
  }
  if (progress < PHASE_CROSS_END) {
    return 'cross';
  }
  if (progress < COUPLE_STRIKE_IMPACT_PROGRESS + COUPLE_STRIKE_FLASH_HALF_WIDTH) {
    return 'impact';
  }

  return 'aftermath';
}

function computeFlashIntensity(progress: CoupleStrikeProgress): number {
  const distance = Math.abs(progress - COUPLE_STRIKE_IMPACT_PROGRESS);
  if (distance >= COUPLE_STRIKE_FLASH_HALF_WIDTH) {
    return 0;
  }

  const normalized = 1 - distance / COUPLE_STRIKE_FLASH_HALF_WIDTH;
  return easeOutQuad(normalized);
}

function resolveLeftCharacter(progress: CoupleStrikeProgress): CharacterTrack {
  const approachT = segmentProgress(progress, 0, PHASE_APPROACH_END);
  const overtakeT = segmentProgress(progress, PHASE_APPROACH_END, PHASE_OVERTAKE_END);
  const spinT = segmentProgress(progress, PHASE_OVERTAKE_END, PHASE_SPIN_END);
  const crossT = segmentProgress(progress, PHASE_SPIN_END, PHASE_CROSS_END);
  const aftermathT = segmentProgress(progress, PHASE_CROSS_END, 1);

  const spinRevolutions = 2.25;
  const spinAngle = spinT * Math.PI * 2 * spinRevolutions;
  const crossSpin = crossT * Math.PI * 0.35;

  let x = lerp(-2.4, -1.8, easeOutQuad(approachT));
  let y = lerp(1.6, 1.35, easeInQuad(overtakeT));
  let z = lerp(11, 6.5, easeInCubic(approachT));

  if (progress >= PHASE_APPROACH_END) {
    z = lerp(6.5, -1.8, easeInCubic(overtakeT));
    x = lerp(-1.8, -2.2, easeOutQuad(overtakeT));
  }

  if (progress >= PHASE_OVERTAKE_END) {
    z = lerp(-1.8, 0.35, easeOutQuad(spinT));
    x = lerp(-2.2, -0.55, easeOutQuad(spinT));
    y = lerp(1.35, 1.15, spinT);
  }

  if (progress >= PHASE_SPIN_END) {
    z = lerp(0.35, 0.55, easeInQuad(crossT));
    x = lerp(-0.55, -0.38, easeInCubic(crossT));
    y = lerp(1.15, 1.05, crossT);
  }

  if (progress >= PHASE_CROSS_END) {
    x = lerp(-0.38, -0.85, aftermathT);
    z = lerp(0.55, 1.2, aftermathT);
    y = lerp(1.05, 0.95, aftermathT);
  }

  const yaw = lerp(-0.15, -Math.PI * 0.5, overtakeT) + spinAngle + crossSpin;
  const pitch = lerp(0, -0.25, spinT) + lerp(0, 0.18, crossT);
  const roll = lerp(0, 0.35, spinT);

  const bladeRotation = lerp(-0.4, -1.15, crossT);

  return {
    position: [x, y, z],
    rotation: [pitch, yaw, roll],
    bladeRotation,
  };
}

function resolveRightCharacter(progress: CoupleStrikeProgress): CharacterTrack {
  const approachT = segmentProgress(progress, 0, PHASE_APPROACH_END);
  const overtakeT = segmentProgress(progress, PHASE_APPROACH_END, PHASE_OVERTAKE_END);
  const spinT = segmentProgress(progress, PHASE_OVERTAKE_END, PHASE_SPIN_END);
  const crossT = segmentProgress(progress, PHASE_SPIN_END, PHASE_CROSS_END);
  const aftermathT = segmentProgress(progress, PHASE_CROSS_END, 1);

  const spinRevolutions = 2.25;
  const spinAngle = spinT * Math.PI * 2 * spinRevolutions;
  const crossSpin = crossT * Math.PI * 0.35;

  let x = lerp(2.4, 1.8, easeOutQuad(approachT));
  let y = lerp(1.55, 1.3, easeInQuad(overtakeT));
  let z = lerp(11.4, 6.8, easeInCubic(approachT));

  if (progress >= PHASE_APPROACH_END) {
    z = lerp(6.8, -1.6, easeInCubic(overtakeT));
    x = lerp(1.8, 2.1, easeOutQuad(overtakeT));
  }

  if (progress >= PHASE_OVERTAKE_END) {
    z = lerp(-1.6, 0.4, easeOutQuad(spinT));
    x = lerp(2.1, 0.55, easeOutQuad(spinT));
    y = lerp(1.3, 1.1, spinT);
  }

  if (progress >= PHASE_SPIN_END) {
    z = lerp(0.4, 0.55, easeInQuad(crossT));
    x = lerp(0.55, 0.38, easeInCubic(crossT));
    y = lerp(1.1, 1.02, crossT);
  }

  if (progress >= PHASE_CROSS_END) {
    x = lerp(0.38, 0.85, aftermathT);
    z = lerp(0.55, 1.25, aftermathT);
    y = lerp(1.02, 0.92, aftermathT);
  }

  const yaw = lerp(0.15, Math.PI * 0.5, overtakeT) - spinAngle - crossSpin;
  const pitch = lerp(0, -0.22, spinT) + lerp(0, 0.16, crossT);
  const roll = lerp(0, -0.35, spinT);

  const bladeRotation = lerp(0.4, 1.15, crossT);

  return {
    position: [x, y, z],
    rotation: [pitch, yaw, roll],
    bladeRotation,
  };
}

function toPose(track: CharacterTrack): StrikeCharacterPose {
  return {
    position: track.position,
    rotation: track.rotation,
    bladeRotation: track.bladeRotation,
  };
}

/**
 * Maps global scroll progress to normalized CoupleStrike sequence progress.
 * Returns 0 before the scene, 1 after it, and local progress while active.
 */
export function getCoupleStrikeProgress(globalProgress: number): CoupleStrikeProgress {
  const state = resolveSceneTimelineState(OPERATION_RAVENNA_TIMELINE, globalProgress);

  if (state.sceneId === 'coupleStrike') {
    return state.localProgress;
  }

  const strikeScene = OPERATION_RAVENNA_TIMELINE.scenes.find((scene) => scene.id === 'coupleStrike');
  if (!strikeScene) {
    return 0;
  }

  if (globalProgress < strikeScene.start) {
    return 0;
  }

  return 1;
}

/** Returns whether the CoupleStrike scene (or its immediate aftermath) is active. */
export function isCoupleStrikeSceneActive(globalProgress: number): boolean {
  const state = resolveSceneTimelineState(OPERATION_RAVENNA_TIMELINE, globalProgress);
  return state.sceneId === 'coupleStrike' || state.sceneId === 'countdownTransition';
}

/**
 * Resolves the full CoupleStrike cinematic state for a normalized progress value.
 */
export function resolveCoupleStrikeSequence(progress: number): CoupleStrikeSequenceState {
  const normalized = clampTimelineProgress(progress);
  const phase = resolvePhase(normalized);
  const flashIntensity = computeFlashIntensity(normalized);
  const bladesCrossed = normalized >= PHASE_SPIN_END && normalized <= PHASE_CROSS_END + 0.08;

  return {
    progress: normalized,
    phase,
    left: toPose(resolveLeftCharacter(normalized)),
    right: toPose(resolveRightCharacter(normalized)),
    flashIntensity,
    bladesCrossed,
  };
}
