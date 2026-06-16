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
};
