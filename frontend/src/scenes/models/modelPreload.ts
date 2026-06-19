import { useGLTF } from '@react-three/drei';

import {
  getCinematicSceneModelEntry,
  type CinematicGltfSource,
} from '@/constants/cinematicModelRegistry';
import {
  MODULAR_PRELOAD_BY_SCENE,
  READY_MODEL_URLS,
  type ModelAssetUrl,
} from '@/constants/modelRegistry';
import { OPERATION_RAVENNA_TIMELINE } from '@/constants/operationRavennaTimeline';
import type { OperationRavennaSceneId } from '@/types/scene';

import '@/scenes/models/dracoLoader';

/** Normalized scroll lead time before a scene starts — avoids pop-in on fast scroll. */
export const MODEL_PRELOAD_LOOKAHEAD = 0.05;

const preloadedSources = new Set<string>();

function asGltfPath(source: string): string {
  return source;
}

function markPreloaded(source: string): void {
  preloadedSources.add(source);
}

function preloadGltfSource(source: CinematicGltfSource | ModelAssetUrl, useDraco = true): void {
  if (preloadedSources.has(source)) {
    return;
  }

  markPreloaded(source);
  useGLTF.preload(asGltfPath(source), useDraco);
}

/** Returns scene ids whose window starts within `progress + lookahead`. */
export function resolveScenesToPreload(
  progress: number,
  lookahead: number = MODEL_PRELOAD_LOOKAHEAD,
): OperationRavennaSceneId[] {
  const threshold = progress + lookahead;

  return OPERATION_RAVENNA_TIMELINE.scenes
    .filter((scene) => scene.start <= threshold)
    .map((scene) => scene.id);
}

/** Returns modular GLB URLs to preload for the given scroll progress. */
export function resolveModularModelsToPreload(
  progress: number,
  lookahead: number = MODEL_PRELOAD_LOOKAHEAD,
): ModelAssetUrl[] {
  const sceneIds = resolveScenesToPreload(progress, lookahead);
  const urls = new Set<ModelAssetUrl>();

  for (const sceneId of sceneIds) {
    const models = MODULAR_PRELOAD_BY_SCENE[sceneId] ?? [];

    for (const url of models) {
      if (READY_MODEL_URLS.has(url)) {
        urls.add(url);
      }
    }
  }

  return [...urls];
}

/** Preloads cinematic scene GLTFs and modular models for the current scroll progress. Idempotent. */
export function preloadModelsForScrollProgress(
  progress: number,
  lookahead: number = MODEL_PRELOAD_LOOKAHEAD,
): void {
  const sceneIds = resolveScenesToPreload(progress, lookahead);

  for (const sceneId of sceneIds) {
    const entry = getCinematicSceneModelEntry(sceneId);

    if (entry) {
      preloadGltfSource(entry.source, entry.useDraco);
    }
  }

  for (const url of resolveModularModelsToPreload(progress, lookahead)) {
    preloadGltfSource(url, false);
  }
}

/** Preloads a single modular model URL when marked ready. */
export function preloadReadyModel(url: ModelAssetUrl): void {
  if (!READY_MODEL_URLS.has(url)) {
    return;
  }

  preloadGltfSource(url, false);
}

/** Clears preload bookkeeping — primarily for tests. */
export function resetModelPreloadState(): void {
  preloadedSources.clear();
}

/** @internal Test helper — whether a source was already queued for preload. */
export function isModelSourcePreloaded(source: string): boolean {
  return preloadedSources.has(source);
}
