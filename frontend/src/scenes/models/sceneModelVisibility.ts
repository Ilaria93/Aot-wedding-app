import type { OperationRavennaSceneId } from '@/types/scene';

/**
 * Maps scroll scenes that share an arena export to the GLTF registry scene id.
 */
export function resolveCinematicModelSceneId(
  activeSceneId: OperationRavennaSceneId,
): OperationRavennaSceneId {
  if (activeSceneId === 'countdownTransition') {
    return 'coupleStrike';
  }

  if (activeSceneId === 'streetOpening') {
    return 'rooftops';
  }

  return activeSceneId;
}

/** Returns whether a registry entry should be mounted for the active scroll scene. */
export function isCinematicSceneModelVisible(
  entrySceneId: OperationRavennaSceneId,
  activeSceneId: OperationRavennaSceneId,
): boolean {
  return entrySceneId === resolveCinematicModelSceneId(activeSceneId);
}
