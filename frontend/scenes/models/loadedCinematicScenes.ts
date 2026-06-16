import type { OperationRavennaSceneId } from '@/types/scene';

const loadedSceneIds = new Set<OperationRavennaSceneId>();

/** Marks a scene GLTF as loaded so fallbacks stay hidden when revisiting the scene. */
export function markCinematicSceneLoaded(sceneId: OperationRavennaSceneId): void {
  loadedSceneIds.add(sceneId);
}

/** Returns whether a scene GLTF has already been loaded in this session. */
export function isCinematicSceneLoaded(sceneId: OperationRavennaSceneId): boolean {
  return loadedSceneIds.has(sceneId);
}

/** Clears loaded-scene memory — useful in tests or hot reload. */
export function resetLoadedCinematicScenes(): void {
  loadedSceneIds.clear();
}
