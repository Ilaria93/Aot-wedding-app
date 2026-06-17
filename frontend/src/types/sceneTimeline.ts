import type { OperationRavennaSceneId } from '@/types/scene';

/** Normalized scroll progress in the range [0, 1]. */
export type TimelineProgress = number;

/** Single scene window on the Operation Ravenna scroll timeline. */
export type SceneTimelineSegment = {
  readonly id: OperationRavennaSceneId;
  readonly start: TimelineProgress;
  readonly end: TimelineProgress;
};

/** Ordered list of scenes covering the full scroll range. */
export type SceneTimeline = {
  readonly scenes: readonly SceneTimelineSegment[];
};

/** Active scene resolved at a given global progress value. */
export type ActiveScene = {
  readonly scene: SceneTimelineSegment;
  readonly index: number;
  readonly localProgress: TimelineProgress;
};

/** Snapshot of global and local scene state for a scroll position. */
export type SceneTimelineState = {
  readonly globalProgress: TimelineProgress;
  readonly sceneId: OperationRavennaSceneId;
  readonly scene: SceneTimelineSegment;
  readonly index: number;
  readonly localProgress: TimelineProgress;
};
