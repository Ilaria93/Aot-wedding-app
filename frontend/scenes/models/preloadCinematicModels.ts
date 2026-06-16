import { useGLTF } from '@react-three/drei';
import type { GLTF } from 'three-stdlib';
import type { ObjectMap } from '@react-three/fiber';

import {
  CINEMATIC_SCENE_MODEL_ENTRIES,
  getCinematicModelSources,
  type CinematicGltfSource,
} from '@/constants/cinematicModelRegistry';

import '@/scenes/models/dracoLoader';

function asGltfPath(source: CinematicGltfSource): string {
  return source as unknown as string;
}

/** Preloads every Operation Ravenna GLTF so scene switches do not pop in. */
export function preloadCinematicModels(): void {
  const dracoBySource = new Map(
    CINEMATIC_SCENE_MODEL_ENTRIES.map((entry) => [entry.source, entry.useDraco]),
  );

  for (const source of getCinematicModelSources()) {
    useGLTF.preload(asGltfPath(source), dracoBySource.get(source) ?? true);
  }
}

/** Clears the drei GLTF cache for a single scene source. */
export function clearCinematicModelCache(source: CinematicGltfSource): void {
  useGLTF.clear(asGltfPath(source));
}

/** Clears every cached Operation Ravenna GLTF source. */
export function clearAllCinematicModelCaches(): void {
  for (const source of getCinematicModelSources()) {
    useGLTF.clear(asGltfPath(source));
  }
}

export type LoadedSceneGltf = GLTF & ObjectMap;
