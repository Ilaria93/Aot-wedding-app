import type { RefObject } from 'react';

import type { CinematicCameraDebugSnapshot } from '@/types/cinematicDebug';

/** Scene identifiers for the Operation Ravenna cinematic sequence. */
export type OperationRavennaSceneId =
  | 'rooftops'
  | 'wallsApproach'
  | 'wallLaunch'
  | 'titanCorridor'
  | 'coupleStrike'
  | 'countdownTransition';

/** @deprecated Use OperationRavennaSceneId instead. */
export type HeroChapterId = OperationRavennaSceneId;

/** Normalized scroll progress in the range [0, 1]. */
export type ScrollProgress = number;

export type SceneManagerProps = {
  progress?: ScrollProgress;
  /** High-frequency progress ref for per-frame 3D updates (web scroll scrub). */
  progressRef?: RefObject<number>;
  /** Dev-only camera snapshot ref for the Operation Ravenna debug overlay. */
  cameraDebugRef?: RefObject<CinematicCameraDebugSnapshot>;
  /** Dev-only camera path helper visibility (H key). */
  showCameraPathHelpers?: boolean;
};
