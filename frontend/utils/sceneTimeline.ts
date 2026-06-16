import type { OperationRavennaSceneId } from '@/types/scene';
import type {
  ActiveScene,
  SceneTimeline,
  SceneTimelineSegment,
  SceneTimelineState,
  TimelineProgress,
} from '@/types/sceneTimeline';

/** Clamps a value to the normalized timeline range [0, 1]. */
export function clampTimelineProgress(value: number): TimelineProgress {
  return Math.min(1, Math.max(0, value));
}

/** Maps global scroll progress to a local factor within a scene segment. */
export function toSceneLocalProgress(
  scene: SceneTimelineSegment,
  progress: TimelineProgress,
): TimelineProgress {
  const span = scene.end - scene.start;
  if (span <= 0) {
    return 0;
  }

  return clampTimelineProgress((progress - scene.start) / span);
}

/** Returns whether global progress falls inside the scene window. */
export function isProgressInScene(
  scene: SceneTimelineSegment,
  progress: number,
  options: { isLastScene?: boolean } = {},
): boolean {
  const clamped = clampTimelineProgress(progress);
  const isLast = options.isLastScene ?? false;

  return clamped >= scene.start && (clamped < scene.end || (isLast && clamped <= scene.end));
}

/**
 * Finds the scene active at the given scroll progress.
 * Segments use half-open intervals [start, end), except the last scene which is inclusive on end.
 */
export function findActiveScene(timeline: SceneTimeline, progress: number): ActiveScene {
  const { scenes } = timeline;

  if (scenes.length === 0) {
    throw new Error('SceneTimeline requires at least one scene.');
  }

  const clamped = clampTimelineProgress(progress);

  for (let index = 0; index < scenes.length; index += 1) {
    const scene = scenes[index];
    const isLast = index === scenes.length - 1;

    if (isProgressInScene(scene, clamped, { isLastScene: isLast })) {
      return {
        scene,
        index,
        localProgress: toSceneLocalProgress(scene, clamped),
      };
    }
  }

  if (clamped < scenes[0].start) {
    return {
      scene: scenes[0],
      index: 0,
      localProgress: 0,
    };
  }

  const lastIndex = scenes.length - 1;
  const lastScene = scenes[lastIndex];

  return {
    scene: lastScene,
    index: lastIndex,
    localProgress: 1,
  };
}

/** Resolves global progress into scene id, segment metadata and local progress. */
export function resolveSceneTimelineState(
  timeline: SceneTimeline,
  progress: number,
): SceneTimelineState {
  const globalProgress = clampTimelineProgress(progress);
  const active = findActiveScene(timeline, globalProgress);

  return {
    globalProgress,
    sceneId: active.scene.id,
    scene: active.scene,
    index: active.index,
    localProgress: active.localProgress,
  };
}

/** Looks up a scene segment by id. */
export function findSceneById(
  timeline: SceneTimeline,
  sceneId: OperationRavennaSceneId,
): { scene: SceneTimelineSegment; index: number } | null {
  const index = timeline.scenes.findIndex((scene) => scene.id === sceneId);
  if (index < 0) {
    return null;
  }

  return {
    scene: timeline.scenes[index],
    index,
  };
}

/** Validates scene ordering and bounds. */
export function assertValidSceneTimeline(timeline: SceneTimeline): void {
  const { scenes } = timeline;

  if (scenes.length === 0) {
    throw new Error('SceneTimeline requires at least one scene.');
  }

  for (let index = 0; index < scenes.length; index += 1) {
    const scene = scenes[index];

    if (scene.start >= scene.end) {
      throw new Error(
        `Scene "${scene.id}" has invalid bounds: start (${scene.start}) must be < end (${scene.end}).`,
      );
    }

    if (scene.start < 0 || scene.end > 1) {
      throw new Error(
        `Scene "${scene.id}" must stay within [0, 1]: got [${scene.start}, ${scene.end}].`,
      );
    }

    if (index > 0) {
      const previous = scenes[index - 1];
      if (scene.start < previous.end) {
        throw new Error(
          `Scene "${scene.id}" overlaps "${previous.id}" (${previous.end} > ${scene.start}).`,
        );
      }
    }
  }

  const first = scenes[0];
  const last = scenes[scenes.length - 1];

  if (first.start !== 0) {
    throw new Error(`SceneTimeline must start at 0 (got ${first.start}).`);
  }

  if (last.end !== 1) {
    throw new Error(`SceneTimeline must end at 1 (got ${last.end}).`);
  }
}
